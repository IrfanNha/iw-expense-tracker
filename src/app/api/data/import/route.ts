import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";
import {
  decryptBackup,
  base64ToArrayBuffer,
  base64ToUint8Array,
} from "@/lib/encryption";
import {
  backupDataSchema,
  backupAccountSchema,
  backupCategorySchema,
  backupTransactionSchema,
  backupTransferSchema,
} from "@/lib/validators";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Ensure crypto.subtle is available (Node.js 18+ or Edge Runtime)
export const runtime = "nodejs";

const importSchema = z.object({
  fileData: z.string(), // Base64 encoded backup file
  pin: z.string().min(6, "PIN is required").max(10).regex(/^\d+$/, "PIN must contain only digits"),
  mode: z.enum(["append", "replace"]).default("append"),
  confirmed: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const json = await req.json();
    const parsed = importSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Verify PIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hashedPin: true },
    });

    if (!user || !user.hashedPin) {
      return NextResponse.json(
        { error: "User PIN not found" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(parsed.data.pin, user.hashedPin);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    // Parse backup file
    let backupFile: any;
    try {
      const fileText = atob(parsed.data.fileData);
      backupFile = JSON.parse(fileText);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid backup file format" },
        { status: 400 }
      );
    }

    // Decrypt backup
    const encryptedData = base64ToArrayBuffer(backupFile.encryptedData);
    const iv = base64ToUint8Array(backupFile.iv);
    const signature = backupFile.signature;

    let decryptedBackup;
    try {
      decryptedBackup = await decryptBackup(
        encryptedData,
        iv,
        signature,
        parsed.data.pin,
        userId
      );
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Failed to decrypt backup file" },
        { status: 400 }
      );
    }

    // Validate backup structure with Zod
    const validatedBackup = backupDataSchema.parse(decryptedBackup);

    // If not confirmed, return preview
    if (!parsed.data.confirmed) {
      return NextResponse.json({
        preview: true,
        summary: {
          accounts: validatedBackup.data.accounts.length,
          categories: validatedBackup.data.categories.length,
          transactions: validatedBackup.data.transactions.length,
          transfers: validatedBackup.data.transfers.length,
          version: validatedBackup.version,
          timestamp: validatedBackup.timestamp,
        },
      });
    }

    // Import data (confirmed)
    const results = {
      accounts: { created: 0, updated: 0, errors: [] as string[] },
      categories: { created: 0, updated: 0, errors: [] as string[] },
      transactions: { created: 0, errors: [] as string[] },
      transfers: { created: 0, errors: [] as string[] },
    };

    // Import Accounts
    for (const accountData of validatedBackup.data.accounts) {
      try {
        const validated = backupAccountSchema.parse(accountData);
        const existing = await prisma.account.findFirst({
          where: {
            userId,
            name: validated.name,
          },
        });

        if (existing) {
          if (parsed.data.mode === "replace") {
            await prisma.account.update({
              where: { id: existing.id },
              data: {
                type: validated.type,
                currency: validated.currency,
                icon: validated.icon,
                balance: validated.balance,
              },
            });
            results.accounts.updated++;
          }
        } else {
          await prisma.account.create({
            data: {
              userId,
              name: validated.name,
              type: validated.type,
              currency: validated.currency,
              icon: validated.icon,
              balance: validated.balance,
            },
          });
          results.accounts.created++;
        }
      } catch (error: any) {
        results.accounts.errors.push(
          `Account "${accountData.name}": ${error.message}`
        );
      }
    }

    // Import Categories
    for (const categoryData of validatedBackup.data.categories) {
      try {
        const validated = backupCategorySchema.parse(categoryData);
        const existing = await prisma.category.findFirst({
          where: {
            userId,
            name: validated.name,
            isIncome: validated.isIncome,
          },
        });

        if (!existing) {
          await prisma.category.create({
            data: {
              userId,
              name: validated.name,
              isIncome: validated.isIncome,
              icon: validated.icon,
            },
          });
          results.categories.created++;
        } else if (parsed.data.mode === "replace") {
          await prisma.category.update({
            where: { id: existing.id },
            data: {
              icon: validated.icon,
            },
          });
          results.categories.updated++;
        }
      } catch (error: any) {
        results.categories.errors.push(
          `Category "${categoryData.name}": ${error.message}`
        );
      }
    }

    // Import Transactions
    for (const txData of validatedBackup.data.transactions) {
      try {
        const validated = backupTransactionSchema.parse(txData);
        const account = await prisma.account.findFirst({
          where: {
            userId,
            name: validated.accountName,
          },
        });

        if (!account) {
          results.transactions.errors.push(
            `Transaction: Account "${validated.accountName}" not found`
          );
          continue;
        }

        let categoryId: string | undefined;
        if (validated.categoryName) {
          const category = await prisma.category.findFirst({
            where: {
              userId,
              name: validated.categoryName,
            },
          });
          categoryId = category?.id;
        }

        await prisma.transaction.create({
          data: {
            userId,
            accountId: account.id,
            categoryId,
            amount: validated.amount,
            type: validated.type,
            note: validated.note,
            occurredAt: new Date(validated.occurredAt),
          },
        });

        // Update account balance
        if (validated.type === "INCOME") {
          await prisma.account.update({
            where: { id: account.id },
            data: { balance: { increment: validated.amount } },
          });
        } else if (validated.type === "EXPENSE") {
          await prisma.account.update({
            where: { id: account.id },
            data: { balance: { decrement: validated.amount } },
          });
        }

        results.transactions.created++;
      } catch (error: any) {
        results.transactions.errors.push(`Transaction: ${error.message}`);
      }
    }

    // Import Transfers
    for (const transferData of validatedBackup.data.transfers) {
      try {
        const validated = backupTransferSchema.parse(transferData);
        const fromAccount = await prisma.account.findFirst({
          where: {
            userId,
            name: validated.fromAccountName,
          },
        });

        const toAccount = await prisma.account.findFirst({
          where: {
            userId,
            name: validated.toAccountName,
          },
        });

        if (!fromAccount || !toAccount) {
          results.transfers.errors.push(
            `Transfer: Account not found (from: ${validated.fromAccountName}, to: ${validated.toAccountName})`
          );
          continue;
        }

        if (fromAccount.id === toAccount.id) {
          results.transfers.errors.push(
            `Transfer: Cannot transfer to the same account`
          );
          continue;
        }

        // Create transfer
        const transfer = await prisma.transfer.create({
          data: {
            userId,
            fromAccountId: fromAccount.id,
            toAccountId: toAccount.id,
            amount: validated.amount,
            note: validated.note,
            createdAt: new Date(validated.createdAt),
          },
        });

        // Create transaction records for transfer
        await prisma.transaction.createMany({
          data: [
            {
              userId,
              accountId: fromAccount.id,
              amount: validated.amount,
              type: "TRANSFER_DEBIT",
              occurredAt: transfer.createdAt,
              transferId: transfer.id,
            },
            {
              userId,
              accountId: toAccount.id,
              amount: validated.amount,
              type: "TRANSFER_CREDIT",
              occurredAt: transfer.createdAt,
              transferId: transfer.id,
            },
          ],
        });

        // Update account balances
        await prisma.account.update({
          where: { id: fromAccount.id },
          data: { balance: { decrement: validated.amount } },
        });

        await prisma.account.update({
          where: { id: toAccount.id },
          data: { balance: { increment: validated.amount } },
        });

        results.transfers.created++;
      } catch (error: any) {
        results.transfers.errors.push(`Transfer: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalCreated:
          results.accounts.created +
          results.categories.created +
          results.transactions.created +
          results.transfers.created,
        totalUpdated:
          results.accounts.updated + results.categories.updated,
        totalErrors:
          results.accounts.errors.length +
          results.categories.errors.length +
          results.transactions.errors.length +
          results.transfers.errors.length,
      },
    });
  } catch (error: any) {
    console.error("Import data error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import data" },
      { status: 500 }
    );
  }
}
