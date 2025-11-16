import { z } from "zod";

// Account validators
export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["CASH", "BANK", "CARD", "E_WALLET", "OTHER"]),
  currency: z.string().min(1, "Currency is required"),
  icon: z.string().optional(),
});

export const updateAccountSchema = accountSchema.partial().extend({
  id: z.string(),
});

// Category validators
export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  isIncome: z.boolean(),
  icon: z.string().optional(),
});

export const updateCategorySchema = categorySchema.partial().extend({
  id: z.string(),
});

// Transaction validators
export const transactionSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().optional(),
  amount: z.number().int().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE"]),
  note: z.string().optional(),
  occurredAt: z.string().optional(), // ISO date string
});

// Transfer validators
export const transferSchema = z.object({
  fromAccountId: z.string().min(1, "From account is required"),
  toAccountId: z.string().min(1, "To account is required"),
  amount: z.number().int().positive("Amount must be positive"),
  note: z.string().optional(),
  occurredAt: z.string().optional(), // ISO date string
}).refine((data) => data.fromAccountId !== data.toAccountId, {
  message: "From and to accounts must be different",
  path: ["toAccountId"],
});

// Auth validators
export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  pin: z.string().min(6, "PIN must be at least 6 digits").max(10).regex(/^\d+$/, "PIN must contain only digits"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  pin: z.string().min(6, "PIN is required"),
});

// User update validators
export const updateNameSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const updatePinSchema = z.object({
  currentPin: z.string().min(6, "Current PIN is required"),
  newPin: z.string().min(6, "PIN must be at least 6 digits").max(10).regex(/^\d+$/, "PIN must contain only digits"),
});

// Backup data validators
export const backupAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["CASH", "BANK", "CARD", "E_WALLET", "OTHER"]),
  currency: z.string().min(1),
  icon: z.string().nullable().optional(),
  balance: z.number().int(),
});

export const backupCategorySchema = z.object({
  name: z.string().min(1).max(100),
  isIncome: z.boolean(),
  icon: z.string().nullable().optional(),
});

export const backupTransactionSchema = z.object({
  accountName: z.string().min(1),
  categoryName: z.string().nullable().optional(),
  amount: z.number().int().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  note: z.string().nullable().optional(),
  occurredAt: z.string(),
});

export const backupTransferSchema = z.object({
  fromAccountName: z.string().min(1),
  toAccountName: z.string().min(1),
  amount: z.number().int().positive(),
  note: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const backupDataSchema = z.object({
  version: z.string(),
  timestamp: z.string(),
  data: z.object({
    accounts: z.array(backupAccountSchema),
    categories: z.array(backupCategorySchema),
    transactions: z.array(backupTransactionSchema),
    transfers: z.array(backupTransferSchema),
  }),
  signature: z.string(),
});

