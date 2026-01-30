import { Button } from "@/components/ui/button";
import { FileX } from "lucide-react";

interface EmptyBillsStateProps {
  onCreateClick: () => void;
}

export function EmptyBillsState({ onCreateClick }: EmptyBillsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileX className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg md:text-xl font-semibold mb-2">No bills yet</h3>
      <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-sm">
        Start tracking your bills and installments to stay on top of your payments.
      </p>
      <Button onClick={onCreateClick} size="lg">
        Create Your First Bill
      </Button>
    </div>
  );
}
