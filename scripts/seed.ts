import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const hashedPin = await bcrypt.hash("123456", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@example.com",
      hashedPin,
    },
  });

  console.log("✅ Created user:", user.email);

  // Create accounts (delete existing first to avoid conflicts)
  await prisma.account.deleteMany({ where: { userId: user.id } });

  const cashAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Cash",
      type: "CASH",
      currency: "IDR",
      icon: "Banknote",
      balance: 500000, // 5,000.00 IDR in cents
    },
  });

  const bankAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Bank Account",
      type: "BANK",
      currency: "IDR",
      icon: "Building2",
      balance: 10000000, // 100,000.00 IDR in cents
    },
  });

  const walletAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: "E-Wallet",
      type: "E_WALLET",
      currency: "IDR",
      icon: "CreditCard",
      balance: 2000000, // 20,000.00 IDR in cents
    },
  });

  console.log("✅ Created accounts");

  // Create categories (delete existing first)
  await prisma.category.deleteMany({ where: { userId: user.id } });

  const salaryCategory = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Salary",
      isIncome: true,
      icon: "Briefcase",
    },
  });

  const foodCategory = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Food & Dining",
      isIncome: false,
      icon: "UtensilsCrossed",
    },
  });

  const transportCategory = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Transportation",
      isIncome: false,
      icon: "Car",
    },
  });

  console.log("✅ Created categories");

  // Delete existing transactions and transfers
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.transfer.deleteMany({ where: { userId: user.id } });

  // Reset account balances
  await prisma.account.updateMany({
    where: { userId: user.id },
    data: { balance: 0 },
  });

  // Create income transaction
  const incomeTx = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: bankAccount.id,
      categoryId: salaryCategory.id,
      amount: 5000000, // 50,000.00 IDR
      type: "INCOME",
      note: "Monthly salary",
      occurredAt: new Date(),
    },
  });

  // Update account balance
  await prisma.account.update({
    where: { id: bankAccount.id },
    data: { balance: { increment: incomeTx.amount } },
  });

  // Create expense transactions
  const expense1 = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: cashAccount.id,
      categoryId: foodCategory.id,
      amount: 50000, // 500.00 IDR
      type: "EXPENSE",
      note: "Lunch",
      occurredAt: new Date(),
    },
  });

  await prisma.account.update({
    where: { id: cashAccount.id },
    data: { balance: { decrement: expense1.amount } },
  });

  const expense2 = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: walletAccount.id,
      categoryId: transportCategory.id,
      amount: 25000, // 250.00 IDR
      type: "EXPENSE",
      note: "Taxi fare",
      occurredAt: new Date(),
    },
  });

  await prisma.account.update({
    where: { id: walletAccount.id },
    data: { balance: { decrement: expense2.amount } },
  });

  console.log("✅ Created transactions");

  // Create a transfer
  const transfer = await prisma.transfer.create({
    data: {
      userId: user.id,
      fromAccountId: bankAccount.id,
      toAccountId: cashAccount.id,
      amount: 200000, // 2,000.00 IDR
      note: "Withdrawal for daily expenses",
    },
  });

  const occurredDate = new Date();

  // Create transfer transactions
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: bankAccount.id,
      amount: transfer.amount,
      type: "TRANSFER_DEBIT",
      note: transfer.note,
      occurredAt: occurredDate,
      transferId: transfer.id,
    },
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: cashAccount.id,
      amount: transfer.amount,
      type: "TRANSFER_CREDIT",
      note: transfer.note,
      occurredAt: occurredDate,
      transferId: transfer.id,
    },
  });

  // Update balances
  await prisma.account.update({
    where: { id: bankAccount.id },
    data: { balance: { decrement: transfer.amount } },
  });

  await prisma.account.update({
    where: { id: cashAccount.id },
    data: { balance: { increment: transfer.amount } },
  });

  console.log("✅ Created transfer");

  console.log("\n🎉 Seeding completed!");
  console.log("\nDemo credentials:");
  console.log("Email: demo@example.com");
  console.log("PIN: 123456");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

