"use client";

import { useState } from "react";
import { useBudgetVsActual, useDeleteBudget } from "@/hooks/useBudgets";
import { BudgetSummaryCards } from "./_components/BudgetSummaryCards";
import { BudgetList } from "./_components/BudgetList";
import { EditBudgetDialog } from "./_components/EditBudgetDialog";
import { Button } from "@/components/ui/button";
import {  ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import { Spinner } from "@/components/ui/spinner";

export default function BudgetsPage() {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{
    id: string;
    categoryId: string;
    amount: number;
  } | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const { data: budgetVsActual, isLoading } = useBudgetVsActual({ year, month });
  const deleteBudget = useDeleteBudget();

  // Calculate summary totals
  const totalBudget = budgetVsActual?.reduce((sum, b) => sum + b.budgetAmount, 0) || 0;
  const totalActual = budgetVsActual?.reduce((sum, b) => sum + b.actualAmount, 0) || 0;
  const totalRemaining = totalBudget - totalActual;
  const overallUsageRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const handleCreateBudget = () => {
    setEditingBudget(null);
    setDialogOpen(true);
  };

  const handleEditBudget = (id: string) => {
    const budget = budgetVsActual?.find((b) => b.id === id);
    if (budget) {
      setEditingBudget({
        id: budget.id,
        categoryId: budget.categoryId,
        amount: budget.budgetAmount,
      });
      setDialogOpen(true);
    }
  };

  const handleDeleteBudget = (id: string) => {
    setDeletingBudgetId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingBudgetId) return;

    try {
      await deleteBudget.mutateAsync({ id: deletingBudgetId });
      setDeleteDialogOpen(false);
      setDeletingBudgetId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const formatMonthYear = () => {
    return selectedDate.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 pt-4 md:px-6 md:pt-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Track your spending against your monthly goals
          </p>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center rounded-lg border border-border/60 bg-card p-1 shadow-sm shrink-0 w-fit">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            className="h-8 w-8 rounded-md hover:bg-accent/50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 px-3 text-sm font-semibold hover:bg-accent/50 rounded-md min-w-[120px]"
              >
                {formatMonthYear()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8 rounded-md hover:bg-accent/50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <BudgetSummaryCards
        totalBudget={totalBudget}
        totalActual={totalActual}
        totalRemaining={totalRemaining}
        overallUsageRate={overallUsageRate}
      />

      {/* Budget List */}
      <div className="px-4 pb-6 md:px-6 md:pb-8">
        <BudgetList
          budgets={budgetVsActual || []}
          isLoading={isLoading}
          onEdit={handleEditBudget}
          onDelete={handleDeleteBudget}
          onCreateBudget={handleCreateBudget}
        />
      </div>

      {/* Edit/Create Dialog */}
      <EditBudgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        year={year}
        month={month}
        editingBudget={editingBudget}
      />
      
     

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget? This action cannot be
              undone. Your transactions and financial data will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteBudget.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBudget.isPending ? (
                <span className="flex items-center">
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
