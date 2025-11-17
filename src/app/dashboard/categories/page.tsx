"use client";

import { useState, useEffect } from "react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type Category } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconPicker } from "@/components/features/IconPicker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { categorySchema } from "@/lib/validators";
import * as Icons from "lucide-react";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = categorySchema;

type FormData = z.infer<typeof formSchema>;

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      isIncome: false,
      icon: "",
    },
  });

  useEffect(() => {
    form.setValue("isIncome", activeTab === "income");
  }, [activeTab, form]);

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
    } catch (error) {
      // Error handled by React Query
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setActiveTab(category.isIncome ? "income" : "expense");
    form.reset({
      name: category.name,
      isIncome: category.isIncome,
      icon: category.icon || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory.mutateAsync(id);
      } catch (error: any) {
        alert(error.message || "Failed to delete category");
      }
    }
  };

  const incomeCategories = categories?.filter((cat) => cat.isIncome) || [];
  const expenseCategories = categories?.filter((cat) => !cat.isIncome) || [];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Organize your income and expense categories
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setEditingId(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Category" : "Create Category"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update category details" : "Add a new category"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "expense" | "income")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="expense" className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Expense
                  </TabsTrigger>
                  <TabsTrigger value="income" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Income
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="e.g., Food, Salary"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker
                  value={form.watch("icon")}
                  onValueChange={(value) => form.setValue("icon", value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    setEditingId(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="expense" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="expense" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Expense ({expenseCategories.length})
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Income ({incomeCategories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="space-y-4">
          {expenseCategories.length > 0 ? (
            <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {expenseCategories.map((category) => {
                const IconComponent = (category.icon && Icons[category.icon as keyof typeof Icons]
                  ? Icons[category.icon as keyof typeof Icons]
                  : Icons.Tag) as unknown as React.ComponentType<{ className?: string }>;
                
                return (
                  <Card key={category.id} className="hover:shadow-md transition-all group">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start justify-between mb-3 md:mb-4">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                          <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8"
                            onClick={() => handleEdit(category)}
                          >
                            <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm md:text-base lg:text-lg truncate">{category.name}</h3>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Tag className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No expense categories yet</p>
                <Button onClick={() => setOpen(true)}>Create Category</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          {incomeCategories.length > 0 ? (
            <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {incomeCategories.map((category) => {
                const IconComponent = (category.icon && Icons[category.icon as keyof typeof Icons]
                  ? Icons[category.icon as keyof typeof Icons]
                  : Icons.Tag) as unknown as React.ComponentType<{ className?: string }>;
                
                return (
                  <Card key={category.id} className="hover:shadow-md transition-all group">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start justify-between mb-3 md:mb-4">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                          <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8"
                            onClick={() => handleEdit(category)}
                          >
                            <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm md:text-base lg:text-lg truncate">{category.name}</h3>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Tag className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No income categories yet</p>
                <Button onClick={() => {
                  setActiveTab("income");
                  setOpen(true);
                }}>Create Category</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
