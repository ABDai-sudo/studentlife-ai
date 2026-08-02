import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@studentlife.ai";
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      status: true,
      role: true,
      failedLoginCount: true,
    },
  });

  if (!user) {
    console.log("STATUS=missing");
    const passwordHash = await bcrypt.hash("Demo1234!", 12);
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: "Demo Student",
        emailVerified: true,
        status: "ACTIVE",
        role: "USER",
        profile: {
          create: {
            onboardingComplete: true,
            university: "Demo University",
            course: "Computer Science",
            yearOfStudy: 2,
            studentType: "HOSTEL",
            country: "IN",
            currency: "INR",
            monthlyPocketMoney: 5000,
            primaryGoal: "Save for a new laptop",
          },
        },
        subscriptions: {
          create: { plan: "FREE", status: "ACTIVE" },
        },
      },
      select: { id: true, email: true },
    });
    console.log("CREATED", created.email, created.id);
    return;
  }

  const ok = await bcrypt.compare("Demo1234!", user.passwordHash);
  console.log(
    "STATUS=found",
    user.email,
    user.status,
    user.role,
    "failed=",
    user.failedLoginCount,
    "password_ok=",
    ok
  );

  if (!ok || user.status !== "ACTIVE" || user.failedLoginCount > 0) {
    const passwordHash = await bcrypt.hash("Demo1234!", 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginCount: 0,
        status: "ACTIVE",
        suspendedAt: null,
      },
    });
    console.log("RESET=ok");
  }
}

main()
  .catch((e) => {
    console.error("ERROR", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
