"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { BillStatusBadge } from "./BillStatusBadge";
import { BillProgress } from "./BillProgress";
import { useBill, useDeleteBill } from "@/hooks/useBills";
import { formatCurrency } from "@/lib/money";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar, Tag, Trash2, Edit, CreditCard } from "lucide-react";
import { format } from "date-fns";
// TODO: Install shadcn toast component
import * as React from "react";

interface BillDetailDialogProps {
  billId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPayClick: () => void;
  onEditClick: () => void;
}

export function BillDetailDialog({
  billId,
  open,
  onOpenChange,
  onPayClick,
  onEditClick,
}: BillDetailDialogProps) {
  const { data: bill, isLoading, error } = useBill(billId);
  const deleteBill = useDeleteBill();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const now = new Date();
  const isOverdue = bill && bill.status !== "PAID" && new Date(bill.dueDate) < now;

  const handleDelete = async () => {
    try {
      const hasPayments = bill?.payments && bill.payments.length > 0;
      await deleteBill.mutateAsync({
        id: billId,
        force: hasPayments,
      });
      console.log(hasPayments
        ? "Bill deleted. Transactions preserved."
        : "Bill deleted successfully");
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete bill");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
            <DialogDescription>View and manage your bill information</DialogDescription>
          </DialogHeader>

          {isLoading && (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error instanceof Error ? error.message : "Failed to load bill"}
              </AlertDescription>
            </Alert>
          )}

          {bill && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{bill.name}</h3>
                  {bill.category && (
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      <span className="text-sm">{bill.category.name}</span>
                    </div>
                  )}
                </div>
                <BillStatusBadge status={bill.status} isOverdue={isOverdue} />
              </div>

              {/* Amount Info */}
              <Card className="p-4 bg-muted/50">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(bill.totalAmount)}
                    </span>
                  </div>
                  {bill.totalPaid !== undefined && bill.totalPaid > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Paid</span>
                        <span className="text-lg font-semibold text-green-600">
                          {formatCurrency(bill.totalPaid)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Remaining</span>
                        <span className="text-lg font-semibold">
                          {formatCurrency(bill.remaining || 0)}
                        </span>
                      </div>
                      <BillProgress
                        totalPaid={bill.totalPaid}
                        totalAmount={bill.totalAmount}
                      />
                    </>
                  )}
                </div>
              </Card>

              {/* Due Date */}
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className={`font- medium ${isOverdue ? "text-red-600" : ""}`}>
                    {format(new Date(bill.dueDate), "PPP")}
                    {isOverdue && " (Overdue)"}
                  </p>
                </div>
              </div>

              {/* Note */}
              {bill.note && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Note</p>
                  <p className="text-sm">{bill.note}</p>
                </div>
              )}

              {/* Payment History */}
              {bill.payments && bill.payments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Payment History</h4>
                  <div className="space-y-2">
                    {bill.payments.map((payment) => (
                      <Card key={payment.id} className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <CreditCard className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {formatCurrency(payment.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(payment.paidAt), "PPP 'at' p")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {bill.status !== "PAID" && (
                  <Button onClick={onPayClick} className="flex-1">
                    Pay Bill
                  </Button>
                )}
                {bill.status !== "PAID" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onEditClick();
                      onOpenChange(false);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill?</AlertDialogTitle>
            <AlertDialogDescription>
              {bill?.payments && bill.payments.length > 0 ? (
                <>
                  This bill has <strong>{bill.payments.length}</strong> payment(s).
                  Deleting will remove the bill tracking, but all related transactions
                  will be preserved in your transaction history.
                </>
              ) : (
                "This action cannot be undone. This will permanently delete the bill."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBill.isPending ? "Deleting..." : "Delete Bill"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
