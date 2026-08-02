import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionFromCookies,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import type { SignupInput, LoginInput } from "@/lib/validations/auth";
import type { AuthUser } from "@/lib/auth";
import { hashToken } from "@/lib/security/hash";
import { progressiveLoginDelayMs } from "@/lib/security/rate-limit";
import { trackAnalyticsEvent } from "@/services/analytics.service";
import { recordSecurityEvent } from "@/services/audit.service";
import type { AccountStatus, UserRole } from "@prisma/client";

export class AuthError extends Error {
  constructor(
    message: string,
    public code:
      | "EMAIL_TAKEN"
      | "INVALID_CREDENTIALS"
      | "USER_NOT_FOUND"
      | "ACCOUNT_SUSPENDED"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function toAuthUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: AccountStatus;
  mfaEnabled: boolean;
  profile: { onboardingComplete: boolean } | null;
  subscriptions: { plan: "FREE" | "PREMIUM" }[];
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    onboardingComplete: user.profile?.onboardingComplete ?? false,
    plan: user.subscriptions[0]?.plan ?? "FREE",
    role: user.role,
    status: user.status,
    mfaEnabled: user.mfaEnabled,
  };
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  mfaEnabled: true,
  profile: { select: { onboardingComplete: true } },
  subscriptions: {
    where: { status: "ACTIVE" as const },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { plan: true },
  },
};

const DUMMY_HASH =
  "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";

export async function signupUser(input: SignupInput): Promise<AuthUser> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw new AuthError("An account with this email already exists", "EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      role: "USER",
      status: "ACTIVE",
      profile: { create: {} },
      subscriptions: { create: { plan: "FREE", status: "ACTIVE" } },
      streaks: {
        create: [
          { type: "expense_logging" },
          { type: "budget" },
          { type: "saving" },
        ],
      },
    },
    select: userSelect,
  });

  await createAndStoreSession(user.id, user.email);
  void trackAnalyticsEvent({ eventName: "signup_completed" }, user.id);
  return toAuthUser(user);
}

export async function loginUser(
  input: LoginInput,
  context?: { ipHash?: string; userAgentCat?: string }
): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...userSelect, passwordHash: true, failedLoginCount: true },
  });

  if (!user) {
    await verifyPassword(input.password, DUMMY_HASH);
    void trackAnalyticsEvent({ eventName: "login_failure" });
    throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (user.status === "SUSPENDED" || user.status === "DISABLED") {
    void recordSecurityEvent({
      type: "login_blocked_inactive",
      severity: "MEDIUM",
      userId: user.id,
      ipHash: context?.ipHash,
      messageSafe: "Login blocked for inactive account",
    });
    throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS");
  }

  const delay = progressiveLoginDelayMs(user.failedLoginCount);
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: { increment: 1 } },
    });
    void trackAnalyticsEvent({ eventName: "login_failure" }, user.id);
    void recordSecurityEvent({
      type: "login_failure",
      severity: "LOW",
      userId: user.id,
      ipHash: context?.ipHash,
      messageSafe: "Failed login attempt",
    });
    throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lastLoginAt: new Date(),
      lastActiveAt: new Date(),
    },
  });

  await createAndStoreSession(user.id, user.email, context);
  void trackAnalyticsEvent({ eventName: "login_success" }, user.id);

  if (user.role === "OWNER") {
    void recordSecurityEvent({
      type: "owner_login_success",
      severity: "INFO",
      userId: user.id,
      ipHash: context?.ipHash,
      messageSafe: "Owner login succeeded",
    });
  }

  return toAuthUser(user);
}

async function createAndStoreSession(
  userId: string,
  email: string,
  context?: { ipHash?: string; userAgentCat?: string }
) {
  const token = await createSessionToken({ userId, email });
  await setSessionCookie(token);

  const maxAge = Number.parseInt(process.env.AUTH_SESSION_MAX_AGE || "604800", 10);
  const expiresAt = new Date(
    Date.now() + (Number.isFinite(maxAge) ? maxAge : 604800) * 1000
  );

  try {
    await prisma.authSession.create({
      data: {
        userId,
        sessionTokenHash: hashToken(token),
        userAgentCategory: context?.userAgentCat ?? null,
        ipHash: context?.ipHash ?? null,
        expiresAt,
      },
    });
  } catch {
    // optional until migration applied
  }
}

export async function logoutUser(): Promise<void> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (token) {
      await prisma.authSession.updateMany({
        where: { sessionTokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  } catch {
    // ignore
  }
  await clearSessionCookie();
  void trackAnalyticsEvent({ eventName: "logout" });
}

export async function revokeAllSessionsForUser(
  userId: string,
  exceptTokenHash?: string
): Promise<number> {
  const result = await prisma.authSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptTokenHash
        ? { sessionTokenHash: { not: exceptTokenHash } }
        : {}),
    },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

export async function getSessionTokenHash(): Promise<string | null> {
  const session = await getSessionFromCookies();
  if (!session) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return token ? hashToken(token) : null;
}
