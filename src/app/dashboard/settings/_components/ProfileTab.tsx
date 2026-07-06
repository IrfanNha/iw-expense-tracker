"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useUpdateName } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateNameSchema } from "@/lib/validators";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, AlertCircle } from "lucide-react";

type NameFormData = z.infer<typeof updateNameSchema>;

export function ProfileTab() {
  const { data: session } = useSession();
  const updateName = useUpdateName();

  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const nameForm = useForm<NameFormData>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: {
      name: session?.user?.name || "",
    },
  });

  const onNameSubmit = async (data: NameFormData) => {
    try {
      await updateName.mutateAsync(data);
      setSuccessDialogOpen(true);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to update name");
      setErrorDialogOpen(true);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-base md:text-lg font-semibold">Update Name</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Change your display name shown in the application.
          </p>
        </div>

        <form
          onSubmit={nameForm.handleSubmit(onNameSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Display Name
            </Label>
            <Input
              id="name"
              className="rounded-lg"
              {...nameForm.register("name")}
              placeholder="Enter your name"
            />
            {nameForm.formState.errors.name && (
              <p className="text-xs font-medium text-destructive mt-1">
                {nameForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={updateName.isPending} className="rounded-lg" size="sm">
              {updateName.isPending ? "Updating..." : "Update Name"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => nameForm.reset({ name: session?.user?.name || "" })}
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
              Your name has been updated successfully!
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
