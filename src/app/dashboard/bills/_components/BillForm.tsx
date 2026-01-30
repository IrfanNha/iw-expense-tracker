"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon,Tag } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { parseInputToCents, formatCentsToDisplay } from "@/lib/money";
import { billSchema } from "@/lib/validators";
import { useCategories } from "@/hooks/useCategories";
import { AmountInput } from "@/components/forms/AmountInput";
import * as Icons from "lucide-react";

const formSchema = billSchema.extend({
  totalAmount: z.string().min(1, "Amount is required"),
});

type FormData = z.infer<typeof formSchema> & { totalAmount: string };

interface BillFormProps {
  bill?: {
    id: string;
    name: string;
    categoryId?: string | null;
    totalAmount: number;
    dueDate: string;
    note?: string | null;
  } | null;
  onSubmit: (data: {
    name: string;
    categoryId?: string;
    totalAmount: number;
    dueDate: string;
    note?: string;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function BillForm({ bill, onSubmit, onCancel, isSubmitting }: BillFormProps) {
  const { data: categories } = useCategories();
  const expenseCategories = categories?.filter((cat) => !cat.isIncome) || [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: bill?.name || "",
      categoryId: bill?.categoryId || "",
      totalAmount: bill ? formatCentsToDisplay(bill.totalAmount) : "",
      dueDate: bill?.dueDate ? new Date(bill.dueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      note: bill?.note || "",
    },
  });

  const handleSubmit = async (data: FormData) => {
    const amountInCents = parseInputToCents(data.totalAmount);

    await onSubmit({
      name: data.name,
      categoryId: data.categoryId || undefined,
      totalAmount: amountInCents,
      dueDate: typeof data.dueDate === 'string' ? data.dueDate : data.dueDate.toISOString().split('T')[0],
      note: data.note || undefined,
    });

    if (!bill) {
      form.reset();
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Bill Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Bill Name</Label>
        <Input
          id="name"
          placeholder="e.g., Internet Bill, Phone Bill"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="categoryId">Category (Optional)</Label>
        <Select
          value={form.watch("categoryId") || undefined}
          onValueChange={(value) => form.setValue("categoryId", value || "")}
        >
          <SelectTrigger>
            <SelectValue placeholder="No category selected" />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map((category) => {
              const IconComponent = category.icon && (Icons as Record<string, any>)[category.icon]
                ? (Icons as Record<string, any>)[category.icon]
                : Tag;
              
              return (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    {category.name}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <AmountInput
        value={form.watch("totalAmount")}
        onChange={(value) => form.setValue("totalAmount", value)}
        currency="IDR"
        label="Total Amount"
        error={form.formState.errors.totalAmount?.message}
      />

      {/* Due Date */}
      <div className="space-y-2">
        <Label>Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !form.watch("dueDate") && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {form.watch("dueDate")
                ? format(new Date(form.watch("dueDate")), "PPP")
                : "Select due date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={form.watch("dueDate") ? new Date(form.watch("dueDate")) : undefined}
              onSelect={(date) => {
                if (date) {
                  form.setValue("dueDate", format(date, "yyyy-MM-dd"));
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="note">Note (Optional)</Label>
        <Textarea
          id="note"
          placeholder="Add any additional notes..."
          rows={3}
          {...form.register("note")}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (bill ? "Updating..." : "Creating...") : (bill ? "Update Bill" : "Create Bill")}
        </Button>
      </div>
    </form>
  );
}
