"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Tag, TrendingDown, TrendingUp } from "lucide-react";
import * as Icons from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type Category,
} from "@/hooks/useCategories";
import { categorySchema } from "@/lib/validators";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IconPicker } from "@/components/features/IconPicker";

// ─── Schema ────────────────────────────────────────────────────────────────────

type FormData = z.infer<typeof categorySchema>;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CategorySkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
        <div className="flex gap-1">
          <div className="h-7 w-7 rounded-lg bg-muted" />
          <div className="h-7 w-7 rounded-lg bg-muted" />
        </div>
      </div>
      <div className="h-3.5 w-20 rounded bg-muted mt-2" />
    </div>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────

const CategoryCard = React.memo(function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  const IconComponent = (
    category.icon && Icons[category.icon as keyof typeof Icons]
      ? Icons[category.icon as keyof typeof Icons]
      : Icons.Tag
  ) as unknown as React.ComponentType<{ className?: string }>;

  const isIncome = category.isIncome;

  return (
    <div className="group rounded-xl border border-border/60 bg-card p-3 transition-colors hover:bg-accent/20">
      <div className="flex items-start justify-between mb-2">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            isIncome ? "bg-emerald-500/10" : "bg-rose-500/10"
          )}
        >
          <IconComponent
            className={cn(
              "h-5 w-5",
              isIncome
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-0.5 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(category)}
            title="Edit category"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(category.id)}
            title="Delete category"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <p className="text-sm font-semibold leading-tight truncate">{category.name}</p>
    </div>
  );
});

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  type,
  onAdd,
}: {
  type: "expense" | "income";
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
        <Tag className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold mb-1">No {type} categories</p>
      <p className="text-xs text-muted-foreground mb-4">
        Create your first {type} category to organize transactions
      </p>
      <Button size="sm" className="rounded-lg gap-2" onClick={onAdd}>
        <Plus className="h-3.5 w-3.5" />
        Add Category
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formTab, setFormTab] = React.useState<"expense" | "income">("expense");
  const [listTab, setListTab] = React.useState<"expense" | "income">("expense");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", isIncome: false, icon: "" },
  });

  // Sync form isIncome with tab
  React.useEffect(() => {
    form.setValue("isIncome", formTab === "income");
  }, [formTab, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (editingId) {
        await updateCategory.mutateAsync({ id: editingId, ...data });
        setEditingId(null);
      } else {
        await createCategory.mutateAsync(data);
      }
      form.reset();
      setOpen(false);
    } catch {
      // Error handled by React Query
    }
  };

  const handleEdit = React.useCallback((category: Category) => {
    setEditingId(category.id);
    setFormTab(category.isIncome ? "income" : "expense");
    form.reset({ name: category.name, isIncome: category.isIncome, icon: category.icon || "" });
    setOpen(true);
  }, [form]);

  const handleDelete = React.useCallback((id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = React.useCallback(async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory.mutateAsync(categoryToDelete);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete category";
      setErrorMessage(msg);
      setErrorDialogOpen(true);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  }, [categoryToDelete, deleteCategory]);

  const handleDialogClose = (o: boolean) => {
    setOpen(o);
    if (!o) { setEditingId(null); form.reset(); }
  };

  const incomeCategories = categories?.filter((c) => c.isIncome) ?? [];
  const expenseCategories = categories?.filter((c) => !c.isIncome) ?? [];
  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 pt-4 md:px-6 md:pt-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Organize your income and expense categories
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-lg gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Category</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
              <DialogTitle className="text-base font-semibold">
                {editingId ? "Edit Category" : "Create Category"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {editingId ? "Update category details" : "Add a new category"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="px-6 py-5 space-y-4">
                {/* Type toggle — disabled in edit mode */}
                <Tabs
                  value={formTab}
                  onValueChange={(v) => !editingId && setFormTab(v as "expense" | "income")}
                >
                  <TabsList className="grid grid-cols-2 w-full h-10 rounded-lg bg-muted/60">
                    <TabsTrigger
                      value="expense"
                      disabled={!!editingId}
                      className={cn(
                        "flex items-center gap-1.5 text-sm font-medium rounded-md",
                        "data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                      )}
                    >
                      <TrendingDown className="h-3.5 w-3.5" />
                      Expense
                    </TabsTrigger>
                    <TabsTrigger
                      value="income"
                      disabled={!!editingId}
                      className={cn(
                        "flex items-center gap-1.5 text-sm font-medium rounded-md",
                        "data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                      )}
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      Income
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-1.5">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="e.g., Food, Salary"
                    className="rounded-lg border-border/60"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Icon</Label>
                  <IconPicker
                    value={form.watch("icon")}
                    onValueChange={(v) => form.setValue("icon", v)}
                  />
                </div>
              </div>

              <div className="flex gap-2 px-6 pb-6 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => handleDialogClose(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className={cn(
                    "flex-1 rounded-lg font-medium",
                    formTab === "income"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-rose-600 hover:bg-rose-700 text-white"
                  )}
                >
                  {isPending && <Spinner className="mr-2 h-3.5 w-3.5" />}
                  {editingId ? "Save Changes" : `Add ${formTab === "income" ? "Income" : "Expense"}`}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category tabs */}
      <div className="px-4 pb-6 md:px-6 md:pb-8">
        <Tabs value={listTab} onValueChange={(v) => setListTab(v as "expense" | "income")}>
          <TabsList className="grid w-full grid-cols-2 h-10 rounded-lg bg-muted/60 mb-4">
            <TabsTrigger
              value="expense"
              className="flex items-center gap-1.5 text-sm rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <TrendingDown className="h-3.5 w-3.5" />
              Expense
              <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">
                ({expenseCategories.length})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="income"
              className="flex items-center gap-1.5 text-sm rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Income
              <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">
                ({incomeCategories.length})
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Expense */}
          <TabsContent value="expense">
            {isLoading ? (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 6 }).map((_, i) => <CategorySkeleton key={i} />)}
              </div>
            ) : expenseCategories.length > 0 ? (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {expenseCategories.map((cat) => (
                  <CategoryCard key={cat.id} category={cat} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <EmptyState type="expense" onAdd={() => { setFormTab("expense"); setOpen(true); }} />
            )}
          </TabsContent>

          {/* Income */}
          <TabsContent value="income">
            {isLoading ? (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 4 }).map((_, i) => <CategorySkeleton key={i} />)}
              </div>
            ) : incomeCategories.length > 0 ? (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {incomeCategories.map((cat) => (
                  <CategoryCard key={cat.id} category={cat} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <EmptyState type="income" onAdd={() => { setFormTab("income"); setOpen(true); }} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteCategory.isPending}>
              {deleteCategory.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Deleting…
                </span>
              ) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialogOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
