import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";

interface EmptyBillsStateProps {
  onCreateClick: () => void;
}

export function EmptyBillsState({ onCreateClick }: EmptyBillsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <Receipt className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold mb-1">No bills yet</p>
      <p className="text-xs text-muted-foreground mb-5 max-w-[260px]">
        Start tracking your bills and installments to stay on top of your payments
      </p>
      <Button size="sm" className="rounded-lg gap-2" onClick={onCreateClick}>
        <Plus className="h-3.5 w-3.5" />
        Add Bill
      </Button>
    </div>
  );
}
