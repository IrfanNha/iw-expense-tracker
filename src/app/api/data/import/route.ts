import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";
import { importFromCSV, type ImportData } from "@/lib/csv-utils";
import { z } from "zod";
import type { AccountType } from "@/generated/prisma/client";

const importSchema = z.object({
  csvData: z.string(), // CSV text content
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

    // Parse CSV data
    let importData: ImportData;
    try {
      importData = importFromCSV(parsed.data.csvData);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Failed to parse CSV file" },
        { status: 400 }
      );
    }

    // If not confirmed, return preview
    if (!parsed.data.confirmed) {
      return NextResponse.json({
        preview: true,
        summary: {
          accounts: importData.accounts.length,
          categories: importData.categories.length,
          transactions: importData.transactions.length,
          transfers: importData.transfers.length,
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
    for (const accountData of importData.accounts) {
      try {
        const existing = await prisma.account.findFirst({
          where: {
            userId,
            name: accountData.name,
          },
        });

        if (existing) {
          if (parsed.data.mode === "replace") {
            await prisma.account.update({
              where: { id: existing.id },
              data: {
                type: accountData.type as AccountType,
                currency: accountData.currency,
                icon: accountData.icon,
                balance: accountData.balance,
              },
            });
            results.accounts.updated++;
          }
        } else {
          await prisma.account.create({
            data: {
              userId,
              name: accountData.name,
              type: accountData.type as AccountType,
              currency: accountData.currency,
              icon: accountData.icon,
              balance: accountData.balance,
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
    for (const categoryData of importData.categories) {
      try {
        const existing = await prisma.category.findFirst({
          where: {
            userId,
            name: categoryData.name,
            isIncome: categoryData.isIncome,
          },
        });

        if (!existing) {
          await prisma.category.create({
            data: {
              userId,
              name: categoryData.name,
              isIncome: categoryData.isIncome,
              icon: categoryData.icon,
            },
          });
          results.categories.created++;
        } else if (parsed.data.mode === "replace") {
          await prisma.category.update({
            where: { id: existing.id },
            data: {
              icon: categoryData.icon,
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
    for (const txData of importData.transactions) {
      try {
        const account = await prisma.account.findFirst({
          where: {
            userId,
            name: txData.accountName,
          },
        });

        if (!account) {
          results.transactions.errors.push(
            `Transaction: Account "${txData.accountName}" not found`
          );
          continue;
        }

        let categoryId: string | undefined;
        if (txData.categoryName) {
          const category = await prisma.category.findFirst({
            where: {
              userId,
              name: txData.categoryName,
            },
          });
          categoryId = category?.id;
        }

        await prisma.transaction.create({
          data: {
            userId,
            accountId: account.id,
            categoryId,
            amount: txData.amount,
            type: txData.type,
            note: txData.note,
            occurredAt: new Date(txData.occurredAt),
          },
        });

        // Update account balance
        if (txData.type === "INCOME") {
          await prisma.account.update({
            where: { id: account.id },
            data: { balance: { increment: txData.amount } },
          });
        } else if (txData.type === "EXPENSE") {
          await prisma.account.update({
            where: { id: account.id },
            data: { balance: { decrement: txData.amount } },
          });
        }

        results.transactions.created++;
      } catch (error: any) {
        results.transactions.errors.push(`Transaction: ${error.message}`);
      }
    }

    // Import Transfers
    for (const transferData of importData.transfers) {
      try {
        const fromAccount = await prisma.account.findFirst({
          where: {
            userId,
            name: transferData.fromAccountName,
          },
        });

        const toAccount = await prisma.account.findFirst({
          where: {
            userId,
            name: transferData.toAccountName,
          },
        });

        if (!fromAccount || !toAccount) {
          results.transfers.errors.push(
            `Transfer: Account not found (from: ${transferData.fromAccountName}, to: ${transferData.toAccountName})`
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
            amount: transferData.amount,
            note: transferData.note,
            createdAt: new Date(transferData.createdAt),
          },
        });

        // Create transaction records for transfer
        await prisma.transaction.createMany({
          data: [
            {
              userId,
              accountId: fromAccount.id,
              amount: transferData.amount,
              type: "TRANSFER_DEBIT",
              occurredAt: transfer.createdAt,
              transferId: transfer.id,
            },
            {
              userId,
              accountId: toAccount.id,
              amount: transferData.amount,
              type: "TRANSFER_CREDIT",
              occurredAt: transfer.createdAt,
              transferId: transfer.id,
            },
          ],
        });

        // Update account balances
        await prisma.account.update({
          where: { id: fromAccount.id },
          data: { balance: { decrement: transferData.amount } },
        });

        await prisma.account.update({
          where: { id: toAccount.id },
          data: { balance: { increment: transferData.amount } },
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
