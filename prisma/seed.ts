/**
 * Demo seed — only for local/demo mode.
 * Run: npm run db:seed
 *
 * Does NOT run automatically. Production uses real user signups.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@studentlife.ai";
  const passwordHash = await bcrypt.hash("Demo1234!", 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo user already exists:", email);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Demo Student",
      emailVerified: true,
      profile: {
        create: {
          university: "Demo University",
          course: "Computer Science",
          yearOfStudy: 2,
          studentType: "HOSTEL",
          country: "IN",
          currency: "INR",
          monthlyPocketMoney: 5000,
          primaryGoal: "Save for a new laptop",
          onboardingComplete: true,
        },
      },
      subscriptions: {
        create: {
          plan: "FREE",
          status: "ACTIVE",
        },
      },
      streaks: {
        create: [
          { type: "expense_logging", currentCount: 5, bestCount: 12 },
          { type: "budget", currentCount: 2, bestCount: 3 },
          { type: "saving", currentCount: 7, bestCount: 7 },
        ],
      },
      incomes: {
        create: {
          amount: 5000,
          currency: "INR",
          source: "POCKET_MONEY",
          description: "Monthly pocket money",
          isRecurring: true,
        },
      },
      expenses: {
        create: [
          {
            amount: 120,
            category: "FOOD",
            description: "Campus canteen",
            currency: "INR",
          },
          {
            amount: 80,
            category: "TRANSPORT",
            description: "Auto to college",
            currency: "INR",
          },
        ],
      },
      savingsGoals: {
        create: {
          title: "New Laptop",
          targetAmount: 60000,
          currentAmount: 8000,
          currency: "INR",
          monthlyContribution: 3000,
          status: "ACTIVE",
        },
      },
    },
  });

  console.log("Seeded demo user:");
  console.log("  email:   ", email);
  console.log("  password: Demo1234!");
  console.log("  userId:  ", user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
