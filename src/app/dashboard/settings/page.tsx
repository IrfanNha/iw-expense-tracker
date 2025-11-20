"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useUpdateName, useUpdatePin } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateNameSchema, updatePinSchema } from "@/lib/validators";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Database,
  Shield,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PasswordInput } from "@/components/ui/password-input";
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

const nameFormSchema = updateNameSchema;
const pinFormSchema = updatePinSchema;

type NameFormData = z.infer<typeof nameFormSchema>;
type PinFormData = z.infer<typeof pinFormSchema>;

export default function SettingsPage() {
  const { data: session } = useSession();
  const updateName = useUpdateName();
  const updatePin = useUpdatePin();
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const nameForm = useForm<NameFormData>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: {
      name: session?.user?.name || "",
    },
  });

  const pinForm = useForm<PinFormData>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: {
      currentPin: "",
      newPin: "",
    },
  });

  const onNameSubmit = async (data: NameFormData) => {
    try {
      await updateName.mutateAsync(data);
      setSuccessMessage("Name updated successfully!");
      setSuccessDialogOpen(true);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to update name");
      setErrorDialogOpen(true);
    }
  };

  const onPinSubmit = async (data: PinFormData) => {
    try {
      await updatePin.mutateAsync(data);
      setSuccessMessage("PIN updated successfully!");
      setSuccessDialogOpen(true);
      pinForm.reset();
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to update PIN");
      setErrorDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Update Name</CardTitle>
              <CardDescription>Change your display name</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={nameForm.handleSubmit(onNameSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...nameForm.register("name")}
                    placeholder="Enter your name"
                  />
                  {nameForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {nameForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      nameForm.reset({ name: session?.user?.name || "" })
                    }
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateName.isPending}>
                    {updateName.isPending ? "Updating..." : "Update Name"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Update PIN</CardTitle>
              <CardDescription>
                Change your login PIN. Make sure to remember your new PIN.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={pinForm.handleSubmit(onPinSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="currentPin">Current PIN</Label>
                  <div className="relative">
                    <Input
                      id="currentPin"
                      type={showCurrentPin ? "text" : "password"}
                      {...pinForm.register("currentPin")}
                      placeholder="Enter current PIN"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
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
                    <p className="text-sm text-destructive">
                      {pinForm.formState.errors.currentPin.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPin">New PIN</Label>
                  <div className="relative">
                    <Input
                      id="newPin"
                      type={showNewPin ? "text" : "password"}
                      {...pinForm.register("newPin")}
                      placeholder="Enter new PIN (6-10 digits)"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
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
                    <p className="text-sm text-destructive">
                      {pinForm.formState.errors.newPin.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => pinForm.reset()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updatePin.isPending}>
                    {updatePin.isPending ? "Updating..." : "Update PIN"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <DataManagementTab />
        </TabsContent>
      </Tabs>

      {/* Success Dialog */}
      <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Success</AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuccessDialogOpen(false)}>
              OK
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
            <AlertDialogAction onClick={() => setErrorDialogOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DataManagementTab() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Preview dialog
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Clear all data
  const [isClearing, setIsClearing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showClearConfirmDialog, setShowClearConfirmDialog] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      const response = await fetch("/api/data/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to export data");
      }

      // Get file as blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        setError("Please select a .csv backup file");
        return;
      }
      setImportFile(file);
      setError(null);
      setImportResult(null);
    }
  };

  const handleImportClick = async () => {
    if (!importFile) {
      setError("Please select a file to import");
      return;
    }

    try {
      setIsImporting(true);
      setError(null);

      // Read file as text (CSV)
      const csvText = await importFile.text();

      // First, get preview
      const previewResponse = await fetch("/api/data/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvData: csvText,
          mode: importMode,
          confirmed: false,
        }),
      });

      const previewResult = await previewResponse.json();

      if (!previewResponse.ok) {
        throw new Error(previewResult.error || "Failed to preview import data");
      }

      // Show preview
      setPreviewData(previewResult.summary);
      setShowPreviewDialog(true);
    } catch (err: any) {
      setError(err.message || "Failed to preview import data");
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile) {
      return;
    }

    try {
      setIsImporting(true);
      setError(null);

      // Read file as text (CSV)
      const csvText = await importFile.text();

      const response = await fetch("/api/data/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvData: csvText,
          mode: importMode,
          confirmed: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to import data");
      }

      setImportResult(result);
      setImportFile(null);
      setShowPreviewDialog(false);

      // Reset file input
      const fileInput = document.getElementById(
        "import-file"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh page data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to import data");
      setShowPreviewDialog(false);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearAllData = async () => {
    try {
      setIsClearing(true);
      setError(null);

      const response = await fetch("/api/data/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to clear data");
      }

      setShowClearConfirmDialog(false);
      setShowClearDialog(false);

      // Refresh page after clearing
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to clear data");
      setShowClearConfirmDialog(false);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download all your data (accounts, categories, transactions, and
            transfers) as an encrypted backup file (.enc) for secure backup or
            migration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground mb-2">
              The exported file will include:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>All accounts with balances</li>
              <li>All categories (income and expense)</li>
              <li>All transactions (income and expense only)</li>
              <li>All transfers between accounts</li>
            </ul>
            <div className="mt-3 pt-3 border-t flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Your data will be exported as CSV format. All data is sanitized
                to ensure safe export. Invalid values will be filtered out
                automatically.
              </p>
            </div>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export CSV Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Import data from a previously exported CSV backup file (.csv).
            Invalid data will be automatically filtered out.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="import-mode">Import Mode</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="import-mode"
                  value="append"
                  checked={importMode === "append"}
                  onChange={() => setImportMode("append")}
                  className="h-4 w-4"
                />
                <span className="text-sm">Append (add to existing data)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="import-mode"
                  value="replace"
                  checked={importMode === "replace"}
                  onChange={() => setImportMode("replace")}
                  className="h-4 w-4"
                />
                <span className="text-sm">Replace (update existing items)</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="import-file">Select Backup File (.csv)</Label>
            <Input
              id="import-file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              disabled={isImporting}
            />
            {importFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {importFile.name} (
                {(importFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {importFile && (
            <Button
              onClick={handleImportClick}
              disabled={isImporting}
              className="w-full sm:w-auto"
            >
              {isImporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Preview Import
                </>
              )}
            </Button>
          )}

          {/* Preview Dialog */}
          <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Import Preview
                </DialogTitle>
                <DialogDescription>
                  Review the data that will be imported. Click "Confirm Import"
                  to proceed.
                </DialogDescription>
              </DialogHeader>
              {previewData && (
                <div className="space-y-4 py-4">
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                    <p className="text-sm font-medium">Backup Information</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Version: {previewData.version}</p>
                      <p>
                        Created:{" "}
                        {new Date(previewData.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4 space-y-2">
                    <p className="text-sm font-medium">Data Summary</p>
                    <div className="text-sm space-y-1">
                      <p>Accounts: {previewData.accounts}</p>
                      <p>Categories: {previewData.categories}</p>
                      <p>Transactions: {previewData.transactions}</p>
                      <p>Transfers: {previewData.transfers}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-amber-500/10 border-amber-500/20 p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Mode:{" "}
                      <strong>
                        {importMode === "append" ? "Append" : "Replace"}
                      </strong>
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreviewDialog(false);
                    setPreviewData(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmImport} disabled={isImporting}>
                  {isImporting ? "Importing..." : "Confirm Import"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {importResult && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Import Successful!
              </p>
              <div className="text-sm space-y-1">
                <p>
                  Accounts: {importResult.results.accounts.created} created,{" "}
                  {importResult.results.accounts.updated} updated
                </p>
                <p>
                  Categories: {importResult.results.categories.created} created,{" "}
                  {importResult.results.categories.updated} updated
                </p>
                <p>
                  Transactions: {importResult.results.transactions.created}{" "}
                  created
                </p>
                <p>
                  Transfers: {importResult.results.transfers.created} created
                </p>
                {importResult.summary.totalErrors > 0 && (
                  <p className="text-amber-600 dark:text-amber-400 mt-2">
                    {importResult.summary.totalErrors} errors occurred. Check
                    console for details.
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="rounded-lg border bg-amber-500/10 border-amber-500/20 p-4">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
              ⚠️ Important Notes:
            </p>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
              <li>
                Only CSV backup files (.csv) from this application are supported
              </li>
              <li>
                Account names must match exactly for transactions and transfers
              </li>
              <li>Importing will update account balances automatically</li>
              <li>Backup your current data before importing in replace mode</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions. Use with extreme caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-destructive mb-1">
                  Clear All Data
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete all your accounts, categories,
                  transactions, and transfers. This action cannot be undone.
                  Make sure you have exported your data before proceeding.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside mb-3">
                  <li>All accounts will be deleted</li>
                  <li>All categories will be deleted</li>
                  <li>All transactions will be deleted</li>
                  <li>All transfers will be deleted</li>
                </ul>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  ⚠️ This action is permanent and cannot be reversed!
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowClearDialog(true)}
                disabled={isClearing}
                className="flex-shrink-0"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clear All Data - First Confirmation Dialog */}
      <AlertDialog
        open={showClearDialog}
        onOpenChange={(open) => {
          setShowClearDialog(open);
          if (!open) {
            setConfirmDeleteText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Clear All Data?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to permanently delete <strong>ALL</strong> your
                data:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All accounts</li>
                <li>All categories</li>
                <li>All transactions</li>
                <li>All transfers</li>
              </ul>
              <p className="font-semibold text-destructive mt-3">
                This action cannot be undone!
              </p>
              <p className="text-sm mt-2">
                Make sure you have exported your data before proceeding.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowClearDialog(false);
                setShowClearConfirmDialog(true);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              I understand, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Data - Final Confirmation Dialog */}
      <AlertDialog
        open={showClearConfirmDialog}
        onOpenChange={(open) => {
          setShowClearConfirmDialog(open);
          if (!open) {
            setConfirmDeleteText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Final Confirmation Required
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold">
                Are you absolutely sure you want to delete all your data?
              </p>
              <p className="text-sm">
                This is your last chance to cancel. Once confirmed, all your
                data will be permanently deleted and cannot be recovered.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Type <strong>"DELETE"</strong> in the input below to confirm.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              id="confirm-delete"
              placeholder="Type DELETE to confirm"
              className="font-mono"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConfirmDeleteText("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              disabled={isClearing || confirmDeleteText !== "DELETE"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Data
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
