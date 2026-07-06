"use client";

import { useState } from "react";
import { useUpdatePin } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updatePinSchema } from "@/lib/validators";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PinFormData = z.infer<typeof updatePinSchema>;

export function SecurityTab() {
  const updatePin = useUpdatePin();
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const pinForm = useForm<PinFormData>({
    resolver: zodResolver(updatePinSchema),
    defaultValues: {
      currentPin: "",
      newPin: "",
    },
  });

  const onPinSubmit = async (data: PinFormData) => {
    try {
      await updatePin.mutateAsync(data);
      setSuccessDialogOpen(true);
      pinForm.reset();
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to update PIN");
      setErrorDialogOpen(true);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-base md:text-lg font-semibold">Update PIN</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Change your login PIN. Make sure to remember your new PIN.
          </p>
        </div>

        <form
          onSubmit={pinForm.handleSubmit(onPinSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="currentPin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Current PIN
            </Label>
            <div className="relative">
              <Input
                id="currentPin"
                type={showCurrentPin ? "text" : "password"}
                className="rounded-lg pr-10"
                {...pinForm.register("currentPin")}
                placeholder="Enter current PIN"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
              >
                {showCurrentPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {pinForm.formState.errors.currentPin && (
              <p className="text-xs font-medium text-destructive mt-1">
                {pinForm.formState.errors.currentPin.message}
              </p>
            )}
          </div>

          <div className="space-y-2 max-w-sm">
            <Label htmlFor="newPin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              New PIN
            </Label>
            <div className="relative">
              <Input
                id="newPin"
                type={showNewPin ? "text" : "password"}
                className="rounded-lg pr-10"
                {...pinForm.register("newPin")}
                placeholder="Enter new PIN (6-10 digits)"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                onClick={() => setShowNewPin(!showNewPin)}
              >
                {showNewPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {pinForm.formState.errors.newPin && (
              <p className="text-xs font-medium text-destructive mt-1">
                {pinForm.formState.errors.newPin.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={updatePin.isPending} className="rounded-lg" size="sm">
              {updatePin.isPending ? "Updating..." : "Update PIN"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => pinForm.reset()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Success Dialog */}
      <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <AlertDialogContent className="rounded-xl sm:rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Success
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your PIN has been updated successfully!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuccessDialogOpen(false)} className="rounded-lg">
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent className="rounded-xl sm:rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialogOpen(false)} className="rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
