import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  getSessionFromCookies,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth/session";
import { recordAuditLog } from "@/services/audit.service";
import { safeLog } from "@/lib/security/safe-log";
import { getRequestContext } from "@/lib/security/request";
import type { AccountStatus, UserRole } from "@prisma/client";
import { AuthorizationError } from "./errors";

export { AuthorizationError } from "./errors";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  onboardingComplete: boolean;
  plan: "FREE" | "PREMIUM";
  role: UserRole;
  status: AccountStatus;
  mfaEnabled: boolean;
};

export type OwnerUser = {
  id: string;
  email: string;
  name: string | null;
  role: "OWNER";
  status: "ACTIVE";
  mfaEnabled: boolean;
};

export async function getSession(): Promise<SessionPayload | null> {
  return getSessionFromCookies();
}

async function loadAuthUser(userId: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        mfaEnabled: true,
        profile: { select: { onboardingComplete: true } },
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { plan: true },
        },
      },
    });
    if (!user) return null;
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
  } catch (error) {
    safeLog("error", "Failed to load authenticated user", {
      code: "AUTH_USER_LOAD_FAILED",
      error: String(error),
    });
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSessionFromCookies();
  if (!session) return null;
  const user = await loadAuthUser(session.userId);
  if (!user) return null;
  if (user.status === "DISABLED" || user.status === "SUSPENDED") return null;
  return user;
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAuthenticatedUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError("Authentication required", "UNAUTHORIZED", 401);
  }
  return user;
}

export async function requireOwner(): Promise<OwnerUser> {
  const session = await getSessionFromCookies();
  if (!session) {
    await recordUnauthorizedAdminAttempt(null, "missing_session");
    throw new AuthorizationError("Authentication required", "UNAUTHORIZED", 401);
  }

  const user = await loadAuthUser(session.userId);
  if (!user) {
    await recordUnauthorizedAdminAttempt(session.userId, "user_not_found");
    throw new AuthorizationError("Authentication required", "UNAUTHORIZED", 401);
  }

  if (user.status === "SUSPENDED" || user.status === "DISABLED") {
    await recordUnauthorizedAdminAttempt(user.id, "account_inactive");
    throw new AuthorizationError("Access denied", "FORBIDDEN", 403);
  }

  if (user.role !== "OWNER") {
    await recordUnauthorizedAdminAttempt(user.id, "not_owner");
    throw new AuthorizationError("Access denied", "FORBIDDEN", 403);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: "OWNER",
    status: "ACTIVE",
    mfaEnabled: user.mfaEnabled,
  };
}

export async function requireOwnerPage(): Promise<OwnerUser> {
  try {
    return await requireOwner();
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401) {
      redirect("/login?next=/admin");
    }
    redirect("/dashboard");
  }
}

export async function requireSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

async function recordUnauthorizedAdminAttempt(
  userId: string | null,
  reason: string
) {
  try {
    const ctx = await getRequestContext();
    await recordAuditLog({
      actorUserId: userId,
      action: "admin.unauthorized_access",
      success: false,
      severity: "HIGH",
      reason,
      requestId: ctx.requestId,
      ipHash: ctx.ipHash,
      userAgentCat: ctx.userAgentCat,
      targetType: "admin",
      targetId: "/admin",
    });
  } catch {
    // never block on audit failure
  }
}
