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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

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

  const handleDelete = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory.mutateAsync(categoryToDelete);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to delete category");
      setErrorDialogOpen(true);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const incomeCategories = categories?.filter((cat) => cat.isIncome) || [];
  const expenseCategories = categories?.filter((cat) => !cat.isIncome) || [];

  return (
    <div className="space-y-4 md:space-y-6">
  
      {/* PAGE HEADER */}
      <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Categories
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Organize your income and expense categories
            </p>
          </div>
  
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) {
                setEditingId(null);
                form.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 rounded-sm">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
  
            <DialogContent className="max-w-md min-h-screen max-h-screen md:max-h-[90vh] overflow-y-auto rounded-none space-y-4 md:space-y-5">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Category" : "Create Category"}
                </DialogTitle>
                <DialogDescription>
                  {editingId ? "Update category details" : "Add a new category"}
                </DialogDescription>
              </DialogHeader>
  
              {/* FORM */}
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 md:space-y-5 "
              >
                {/* TYPE */}
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as "expense" | "income")}
                >
                  <TabsList className="grid grid-cols-2 w-full bg-accent">
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
  
                {/* NAME */}
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
  
                {/* ICON */}
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <IconPicker
                    value={form.watch("icon")}
                    onValueChange={(value) => form.setValue("icon", value)}
                  />
                </div>
  
                {/* ACTIONS */}
                <div className="flex justify-end gap-2 pt-4 border-t">
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
  
                  <Button
                    type="submit"
                    disabled={
                      createCategory.isPending || updateCategory.isPending
                    }
                  >
                    {editingId ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
  
      {/* TABS */}
      <Tabs defaultValue="expense" className="w-full p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background ">
        <TabsList className="grid grid-cols-2 w-full mb-6 h-auto p-1 gap-1">
          <TabsTrigger value="expense" className="flex items-center gap-2 text-xs sm:text-sm py-2 data-[state=active]:bg-background">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">Expense</span>
            <span className="sm:hidden">Exp</span>
            <span>({expenseCategories.length})</span>
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center gap-2 text-xs sm:text-sm py-2 data-[state=active]:bg-background">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Income</span>
            <span className="sm:hidden">Inc</span>
            <span>({incomeCategories.length})</span>
          </TabsTrigger>
        </TabsList>
  
        {/* EXPENSE GRID */}
        <TabsContent value="expense" className="space-y-4">
          {expenseCategories.length > 0 ? (
            <div className="
              grid gap-3 md:gap-4
              grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
            ">
              {/* === Category Card === */}
              {expenseCategories.map((category) => {
                const IconComponent =
                  (category.icon &&
                  Icons[category.icon as keyof typeof Icons]
                    ? Icons[category.icon as keyof typeof Icons]
                    : Icons.Tag) as any;
  
                return (
                  <Card
                    key={category.id}
                    className="rounded-sm shadow-none hover:shadow-md transition-all group"
                  >
                    <CardContent className="p-3 md:p-5">
                      <div className="flex items-start justify-between mb-2 md:mb-3">
                        <div className="
                          h-10 w-10 md:h-12 md:w-12 rounded-sm
                          bg-red-500/10 flex items-center justify-center 
                          group-hover:scale-110 transition-transform
                          shrink-0
                        ">
                          <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
                        </div>
  
                        <div className="
                          flex gap-1 md:opacity-0 group-hover:opacity-100 
                          transition-opacity shrink-0
                        ">
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
                            className="h-7 w-7 md:h-8 md:w-8 text-destructive"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </div>
  
                      <h3 className="font-semibold text-sm md:text-base truncate">
                        {category.name}
                      </h3>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="shadow-none">
              <CardContent className="py-12 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Tag className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  No expense categories yet
                </p>
                <Button onClick={() => setOpen(true)}>Create Category</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
  
        {/* INCOME GRID */}
        <TabsContent value="income" className="space-y-4">
          {incomeCategories.length > 0 ? (
            <div className="
              grid gap-3 md:gap-4
              grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
            ">
              {incomeCategories.map((category) => {
                const IconComponent =
                  (category.icon &&
                  Icons[category.icon as keyof typeof Icons]
                    ? Icons[category.icon as keyof typeof Icons]
                    : Icons.Tag) as any;
  
                return (
                  <Card
                    key={category.id}
                    className="shadow-none hover:shadow-md transition-all group rounded-sm"
                  >
                    <CardContent className="p-3 md:p-5">
                      <div className="flex items-start justify-between mb-2 md:mb-3">
                        <div className="
                          h-10 w-10 md:h-12 md:w-12 rounded-sm
                          bg-green-500/10 flex items-center justify-center 
                          group-hover:scale-110 transition-transform
                          shrink-0
                        ">
                          <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                        </div>
  
                        <div className="
                          flex gap-1 md:opacity-0 group-hover:opacity-100 
                          transition-opacity shrink-0
                        ">
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
                            className="h-7 w-7 md:h-8 md:w-8 text-destructive"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </div>
  
                      <h3 className="font-semibold text-sm md:text-base truncate">
                        {category.name}
                      </h3>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="shadow-none">
              <CardContent className="py-12 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Tag className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No income categories yet</p>
                <Button
                  onClick={() => {
                    setActiveTab("income");
                    setOpen(true);
                  }}
                >
                  Create Category
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
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
