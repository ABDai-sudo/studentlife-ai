/**
 * Revoke OWNER role (sets USER).
 * Usage: npm run admin:revoke -- --email="owner@example.com"
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

function parseEmail(argv: string[]): string | null {
  const arg = argv.find((a) => a.startsWith("--email="));
  if (!arg) return null;
  return arg.slice("--email=".length).trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function main() {
  const email = parseEmail(process.argv.slice(2));
  if (!email || !isValidEmail(email)) {
    console.error('Usage: npm run admin:revoke -- --email="user@example.com"');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true },
    });
    if (!user) {
      console.error("Failure: user does not exist.");
      process.exit(1);
    }
    if (user.role !== "OWNER") {
      console.log(`OK: ${user.email} is not OWNER (current role unchanged).`);
      return;
    }
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "USER" },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: "admin.role_revoke_owner",
          targetType: "user",
          targetId: user.id,
          success: true,
          severity: "HIGH",
          reason: "cli_admin_revoke",
          metadata: { email: user.email },
        },
      });
    });
    console.log(`OK: revoked OWNER from ${user.email} (now USER)`);
  } catch {
    console.error(
      "Failure: could not revoke OWNER role. Check database connectivity."
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
