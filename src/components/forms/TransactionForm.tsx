"use client";

/**
 * TransactionForm
 *
 * Add / Edit transaction dialog.
 * - Desktop: centered Dialog, max-w-md, no scroll issues
 * - Mobile: bottom Sheet (drawer-style) for natural thumb reach
 * - Design: clean, mature fintech style — no gradients, strong typography
 * - Logic: unchanged from original (same zod schema, same submit flow)
 */
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import * as Icons from "lucide-react";
import {
  TrendingUp,
  TrendingDown,
  CalendarIcon,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { AccountSelect } from "@/components/forms/AccountSelect";
import { AmountInput } from "@/components/forms/AmountInput";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useCreateTransaction,
  useUpdateTransaction,
  type Transaction,
} from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { parseInputToCents } from "@/lib/money";
import { transactionSchema } from "@/lib/validators";
import { cn } from "@/lib/utils";

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = transactionSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

type FormData = z.infer<typeof formSchema> & { amount: string };

// ─── Props ────────────────────────────────────────────────────────────────────

interface TransactionFormProps {
  trigger?: React.ReactNode;
  transaction?: Transaction | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

// ─── Quick date chips ─────────────────────────────────────────────────────────

const QUICK_DATES = [0, 1, 2].map((daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    daysAgo,
    value: format(d, "yyyy-MM-dd"),
    label: daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : format(d, "d MMM"),
  };
});

// ─── Category grid ────────────────────────────────────────────────────────────

interface CategoryGridProps {
  activeTab: "income" | "expense";
  selectedId: string;
  onSelect: (id: string) => void;
  categories: { id: string; name: string; icon?: string | null; isIncome: boolean }[];
  error?: string;
}

const CategoryGrid = React.memo(function CategoryGrid({
  activeTab,
  selectedId,
  onSelect,
  categories,
  error,
}: CategoryGridProps) {
  const filtered = categories.filter((c) =>
    activeTab === "income" ? c.isIncome : !c.isIncome
  );

  return (
    <div className="space-y-1.5">
      <Label>Category</Label>
      <div className="rounded-xl border border-border/60 overflow-hidden bg-muted/20">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 p-2 max-h-[168px] overflow-y-auto">
            {filtered.map((cat) => {
              const Icon = (
                cat.icon && Icons[cat.icon as keyof typeof Icons]
                  ? Icons[cat.icon as keyof typeof Icons]
                  : Icons.Tag
              ) as unknown as React.ComponentType<{ className?: string }>;
              const isSelected = selectedId === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelect(cat.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-center",
                    "border min-w-0",
                    isSelected
                      ? "bg-foreground text-background border-foreground"
                      : "border-transparent hover:bg-accent hover:border-border/60"
                  )}
                >
                  {isSelected && (
                    <CheckCircle2 className="absolute top-1 right-1 h-2.5 w-2.5 text-background/70" />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-[9px] font-medium leading-tight line-clamp-2 w-full">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No {activeTab} categories yet.{" "}
            <a href="/dashboard/categories" className="underline text-primary">
              Add one
            </a>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});

// ─── Form body (shared between Dialog and Sheet) ──────────────────────────────

interface FormBodyProps {
  form: ReturnType<typeof useForm<FormData>>;
  activeTab: "income" | "expense";
  setActiveTab: (t: "income" | "expense") => void;
  isEditMode: boolean;
  isPending: boolean;
  onCancel: () => void;
  categories: { id: string; name: string; icon?: string | null; isIncome: boolean }[];
  accounts: { id: string; currency: string }[];
}

function FormBody({
  form,
  activeTab,
  setActiveTab,
  isEditMode,
  isPending,
  onCancel,
  categories,
}: FormBodyProps) {
  const selectedAccountId = form.watch("accountId");
  const { data: allAccounts } = useAccounts();
  const selectedAccount = allAccounts?.find((a) => a.id === selectedAccountId);
  const occurredAt = form.watch("occurredAt");

  const submitLabel = isPending
    ? isEditMode
      ? "Saving…"
      : "Adding…"
    : isEditMode
    ? "Save Changes"
    : activeTab === "income"
    ? "Add Income"
    : "Add Expense";

  return (
    <div className="flex flex-col gap-5">
      {/* Type toggle tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => !isEditMode && setActiveTab(v as "income" | "expense")}
      >
        <TabsList className="grid w-full grid-cols-2 h-10 rounded-lg bg-muted/60">
          <TabsTrigger
            value="expense"
            disabled={isEditMode}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium rounded-md",
              "data-[state=active]:bg-rose-600 data-[state=active]:text-white",
              "data-[state=active]:shadow-sm transition-all"
            )}
          >
            <TrendingDown className="h-3.5 w-3.5" />
            Expense
          </TabsTrigger>
          <TabsTrigger
            value="income"
            disabled={isEditMode}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium rounded-md",
              "data-[state=active]:bg-emerald-600 data-[state=active]:text-white",
              "data-[state=active]:shadow-sm transition-all"
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Income
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0 space-y-4">
          {/* Amount */}
          <AmountInput
            value={form.watch("amount")}
            onChange={(v) => form.setValue("amount", v)}
            currency={selectedAccount?.currency || "IDR"}
            error={form.formState.errors.amount?.message}
          />

          {/* Account */}
          <div className="space-y-1.5">
            <Label htmlFor="accountId">Account</Label>
            <AccountSelect
              value={form.watch("accountId")}
              onValueChange={(v) => form.setValue("accountId", v)}
              placeholder="Select account"
            />
            {form.formState.errors.accountId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.accountId.message}
              </p>
            )}
          </div>

          {/* Category */}
          <CategoryGrid
            activeTab={activeTab}
            selectedId={form.watch("categoryId") || ""}
            onSelect={(id) => form.setValue("categoryId", id)}
            categories={categories}
            error={form.formState.errors.categoryId?.message}
          />

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date</Label>
            {/* Quick chips */}
            <div className="flex gap-1.5">
              {QUICK_DATES.map(({ value, label }) => {
                const isSelected = occurredAt === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => form.setValue("occurredAt", value)}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all",
                      isSelected
                        ? "bg-foreground text-background border-foreground"
                        : "border-border/60 hover:bg-accent text-muted-foreground"
                    )}
                  >
                    {label}
                  </button>
                );
              })}

              {/* Calendar popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
                      occurredAt && !QUICK_DATES.find((d) => d.value === occurredAt)
                        ? "bg-foreground text-background border-foreground"
                        : "border-border/60 hover:bg-accent text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={occurredAt ? new Date(occurredAt) : undefined}
                    onSelect={(d) => {
                      if (d) form.setValue("occurredAt", format(d, "yyyy-MM-dd"));
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {/* Selected date display */}
            {occurredAt && (
              <p className="text-xs text-muted-foreground tabular-nums">
                {format(new Date(occurredAt), "EEEE, d MMMM yyyy")}
              </p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="note">
              Note{" "}
              <span className="text-muted-foreground font-normal text-xs">(optional)</span>
            </Label>
            <Input
              id="note"
              placeholder="Add a note…"
              className="rounded-lg border-border/60"
              {...form.register("note")}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer actions */}
      <div className="flex gap-2 pt-4 mt-2 border-t border-border/60">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className={cn(
            "flex-1 rounded-lg font-medium",
            activeTab === "income"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-rose-600 hover:bg-rose-700 text-white"
          )}
        >
          {isPending && <Spinner className="mr-2 h-3.5 w-3.5" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TransactionForm({
  trigger,
  transaction,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: TransactionFormProps) {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isEditMode = !!transaction;
  const [shouldRender, setShouldRender] = React.useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const [activeTab, setActiveTab] = React.useState<"income" | "expense">(
    transaction?.type === "INCOME" ? "income" : "expense"
  );

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const isPending = createTransaction.isPending || updateTransaction.isPending;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountId: transaction?.accountId || "",
      categoryId: transaction?.categoryId || "",
      amount: transaction ? String(transaction.amount / 100) : "",
      type:
        transaction?.type === "INCOME" || transaction?.type === "EXPENSE"
          ? transaction.type
          : "EXPENSE",
      note: transaction?.note || "",
      occurredAt: transaction
        ? new Date(transaction.occurredAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
  });

  // Sync form when editing transaction changes
  React.useEffect(() => {
    if (transaction && open && (transaction.type === "INCOME" || transaction.type === "EXPENSE")) {
      form.reset({
        accountId: transaction.accountId,
        categoryId: transaction.categoryId || "",
        amount: String(transaction.amount / 100),
        type: transaction.type,
        note: transaction.note || "",
        occurredAt: new Date(transaction.occurredAt).toISOString().split("T")[0],
      });
      setActiveTab(transaction.type === "INCOME" ? "income" : "expense");
    } else if (!open && !transaction) {
      form.reset({
        accountId: "",
        categoryId: "",
        amount: "",
        type: "EXPENSE",
        note: "",
        occurredAt: new Date().toISOString().split("T")[0],
      });
      setActiveTab("expense");
    }
  }, [open, transaction, form]);

  // Sync form type field when tab changes (create mode only)
  React.useEffect(() => {
    if (!isEditMode) {
      form.setValue("type", activeTab === "income" ? "INCOME" : "EXPENSE");
      form.setValue("categoryId", "");
    }
  }, [activeTab, form, isEditMode]);

  // Auto-open for edit mode when used without trigger
  React.useEffect(() => {
    if (transaction && controlledOpen === undefined && !open) {
      setOpen(true);
    }
  }, [transaction, open, controlledOpen, setOpen]);

  // Defer rendering of heavy form content to prevent animation stutter on mobile
  React.useEffect(() => {
    if (open) {
      // 300ms matches the Sheet open animation duration perfectly.
      // This ensures the heavy React mount happens *after* the CSS animation completes, removing all jank.
      const timer = setTimeout(() => setShouldRender(true), 300);
      return () => clearTimeout(timer);
    } else {
      // Add a slight delay before unmounting to allow the close animation to finish
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleCancel = React.useCallback(() => {
    setOpen(false);
    form.reset();
  }, [setOpen, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const amountInCents = parseInputToCents(data.amount);

      if (isEditMode && transaction) {
        let occurredAtValue: string | undefined;
        if (data.occurredAt) {
          const sel = new Date(data.occurredAt);
          const orig = new Date(transaction.occurredAt);
          sel.setHours(orig.getHours(), orig.getMinutes(), orig.getSeconds(), orig.getMilliseconds());
          occurredAtValue = sel.toISOString();
        }
        await updateTransaction.mutateAsync({
          id: transaction.id,
          transaction: {
            accountId: data.accountId,
            categoryId: data.categoryId || undefined,
            amount: amountInCents,
            type: data.type,
            note: data.note || undefined,
            occurredAt: occurredAtValue,
          },
        });
      } else {
        let occurredAtValue: string | undefined;
        if (data.occurredAt) {
          const sel = new Date(data.occurredAt);
          const now = new Date();
          sel.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
          occurredAtValue = sel.toISOString();
        }
        await createTransaction.mutateAsync({
          accountId: data.accountId,
          categoryId: data.categoryId || undefined,
          amount: amountInCents,
          type: data.type,
          note: data.note || undefined,
          occurredAt: occurredAtValue,
        });
      }

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch {
      // Errors handled by React Query mutations
    }
  };

  const title = isEditMode ? "Edit Transaction" : "New Transaction";
  const description = isEditMode
    ? "Update the details of this transaction"
    : "Record a new income or expense";

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormBody
        form={form}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isEditMode={isEditMode}
        isPending={isPending}
        onCancel={handleCancel}
        categories={categories}
        accounts={accounts}
      />
    </form>
  );

  // ── Mobile: bottom Sheet ───────────────────────────────────────────────────
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        <SheetContent
          side="bottom"
          className="p-0 rounded-t-2xl max-h-[92dvh] flex flex-col border-0 outline-none"
          aria-describedby={undefined}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" aria-hidden />
          </div>

          <SheetHeader className="px-5 pt-1 pb-3 shrink-0">
            <SheetTitle className="text-base font-semibold text-left">{title}</SheetTitle>
            <SheetDescription className="text-xs text-left">{description}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 min-h-[400px]">
            {shouldRender ? (
              formContent
            ) : (
              <div className="flex h-full w-full items-center justify-center min-h-[300px]">
                <Spinner className="h-6 w-6 text-muted-foreground opacity-50" />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // ── Desktop: centered Dialog ───────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="w-full max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 overflow-y-auto max-h-[80vh] min-h-[400px]">
          {shouldRender ? (
            formContent
          ) : (
            <div className="flex h-full w-full items-center justify-center min-h-[300px]">
              <Spinner className="h-6 w-6 text-muted-foreground opacity-50" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
