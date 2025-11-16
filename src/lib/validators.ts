import { z } from "zod";

// Account validators
export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["CASH", "BANK", "CARD", "E_WALLET", "OTHER"]),
  currency: z.string().default("IDR"),
  icon: z.string().optional(),
});

export const updateAccountSchema = accountSchema.partial().extend({
  id: z.string(),
});

// Category validators
export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  isIncome: z.boolean().default(false),
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

