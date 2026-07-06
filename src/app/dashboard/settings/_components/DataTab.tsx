"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  Upload,
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
import { cn } from "@/lib/utils";

export function DataTab() {
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
      <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6 transition-colors hover:bg-accent/5">
        <div className="mb-6">
          <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Data
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download all your data (accounts, categories, transactions, and
            transfers) as an encrypted backup file (.csv) for secure backup or
            migration.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <p className="text-sm font-medium mb-2">The exported file will include:</p>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside marker:text-muted-foreground/50">
              <li>All accounts with balances</li>
              <li>All categories (income and expense)</li>
              <li>All transactions (income and expense only)</li>
              <li>All transfers between accounts</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-start gap-3">
              <Shield className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your data will be exported as CSV format. All data is sanitized
                to ensure safe export. Invalid values will be filtered out
                automatically.
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto rounded-lg"
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
        </div>
      </div>

      {/* Import Section */}
      <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6 transition-colors hover:bg-accent/5">
        <div className="mb-6">
          <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-500" />
            Import Data
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Import data from a previously exported CSV backup file (.csv).
            Invalid data will be automatically filtered out.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Import Mode
            </Label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="import-mode"
                  value="append"
                  checked={importMode === "append"}
                  onChange={() => setImportMode("append")}
                  className="h-4 w-4 text-primary accent-primary cursor-pointer"
                />
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">Append <span className="text-muted-foreground font-normal">(add to existing)</span></span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="import-mode"
                  value="replace"
                  checked={importMode === "replace"}
                  onChange={() => setImportMode("replace")}
                  className="h-4 w-4 text-primary accent-primary cursor-pointer"
                />
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">Replace <span className="text-muted-foreground font-normal">(overwrite existing)</span></span>
              </label>
            </div>
          </div>

          <div className="space-y-2 max-w-sm">
            <Label htmlFor="import-file" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Select Backup File (.csv)
            </Label>
            <Input
              id="import-file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="rounded-lg file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
            {importFile && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected: <span className="font-medium text-foreground">{importFile.name}</span> (
                {(importFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {importFile && (
            <Button
              onClick={handleImportClick}
              disabled={isImporting}
              className="w-full sm:w-auto rounded-lg"
              variant="secondary"
            >
              {isImporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Preview Import
                </>
              )}
            </Button>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex gap-3 items-start">
               <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 flex gap-3 items-start">
             <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1.5">
                Important Notes
              </p>
              <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1 list-disc list-inside marker:text-orange-500/50">
                <li>Only CSV backup files (.csv) from this application are supported.</li>
                <li>Account names must match exactly for transactions and transfers to link correctly.</li>
                <li>Importing will automatically recalculate and update account balances.</li>
                <li><strong>Highly recommended:</strong> Backup your current data before importing in replace mode.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 md:p-6 mt-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex-1">
             <h2 className="text-base md:text-lg font-semibold flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
              <AlertCircle className="h-5 w-5" />
              Danger Zone
            </h2>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Clear All Data
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-3 leading-relaxed">
              Permanently delete all your accounts, categories, transactions, and transfers. 
              This action cannot be undone. Make sure you have exported your data before proceeding.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside marker:text-muted-foreground/50 mb-4">
              <li>All accounts will be deleted</li>
              <li>All categories will be deleted</li>
              <li>All transactions will be deleted</li>
              <li>All transfers will be deleted</li>
            </ul>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowClearDialog(true)}
            disabled={isClearing}
            className="flex-shrink-0 w-full md:w-auto rounded-lg"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Data
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="rounded-xl sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Import Preview
            </DialogTitle>
            <DialogDescription>
              Review the data that will be imported. Click "Confirm Import"
              to proceed.
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 flex justify-between items-center">
                <p className="text-sm font-medium">Backup Date</p>
                <p className="text-sm text-muted-foreground">{new Date(previewData.timestamp).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border/60 p-4">
                <p className="text-sm font-medium mb-3">Data Summary</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Accounts</p>
                    <p className="text-lg font-semibold">{previewData.accounts}</p>
                  </div>
                   <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Categories</p>
                    <p className="text-lg font-semibold">{previewData.categories}</p>
                  </div>
                   <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Transactions</p>
                    <p className="text-lg font-semibold">{previewData.transactions}</p>
                  </div>
                   <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Transfers</p>
                    <p className="text-lg font-semibold">{previewData.transfers}</p>
                  </div>
                </div>
              </div>
              <div className={cn(
                "rounded-lg border p-3 flex items-center justify-between",
                importMode === "append" ? "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300" : "bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-300"
              )}>
                <p className="text-xs font-medium">
                  Mode: <span className="font-bold uppercase tracking-wider">{importMode}</span>
                </p>
                {importMode === "replace" && (
                   <AlertCircle className="h-4 w-4" />
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="ghost"
              className="rounded-lg"
              onClick={() => {
                setShowPreviewDialog(false);
                setPreviewData(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmImport} disabled={isImporting} className="rounded-lg">
              {isImporting ? "Importing..." : "Confirm Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        <AlertDialogContent className="rounded-xl sm:rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
              Clear All Data?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-sm text-foreground/80">
              <p>
                You are about to permanently delete <strong>ALL</strong> your
                data:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>All accounts</li>
                <li>All categories</li>
                <li>All transactions</li>
                <li>All transfers</li>
              </ul>
              <p className="font-semibold text-rose-600 dark:text-rose-400 pt-2">
                This action cannot be undone!
              </p>
              <p className="text-xs text-muted-foreground">
                Make sure you have exported your data before proceeding.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="rounded-lg border-border/60">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowClearDialog(false);
                setShowClearConfirmDialog(true);
              }}
              className="rounded-lg bg-rose-600 text-white hover:bg-rose-700"
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
        <AlertDialogContent className="rounded-xl sm:rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
              Final Confirmation Required
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="font-medium text-foreground">
                Are you absolutely sure you want to delete all your data?
              </p>
              <p className="text-sm">
                This is your last chance to cancel. Once confirmed, all your
                data will be permanently deleted and cannot be recovered.
              </p>
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md border border-border/60">
                Type <strong className="text-foreground">DELETE</strong> in the input below to confirm.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              id="confirm-delete"
              placeholder="Type DELETE to confirm"
              className="font-mono rounded-lg"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
            />
          </div>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              className="rounded-lg border-border/60"
              onClick={() => {
                setConfirmDeleteText("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              disabled={isClearing || confirmDeleteText !== "DELETE"}
              className="rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
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
      
      {/* Import Success Dialog */}
      <AlertDialog open={!!importResult} onOpenChange={() => setImportResult(null)}>
        <AlertDialogContent className="rounded-xl sm:rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
              Import Successful
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="text-sm space-y-1 mt-2">
                <p>
                  Accounts: {importResult?.results?.accounts?.created} created,{" "}
                  {importResult?.results?.accounts?.updated} updated
                </p>
                <p>
                  Categories: {importResult?.results?.categories?.created} created,{" "}
                  {importResult?.results?.categories?.updated} updated
                </p>
                <p>
                  Transactions: {importResult?.results?.transactions?.created} created
                </p>
                <p>
                  Transfers: {importResult?.results?.transfers?.created} created
                </p>
                {importResult?.summary?.totalErrors > 0 && (
                  <p className="text-orange-600 dark:text-orange-400 mt-2 font-medium">
                    {importResult?.summary?.totalErrors} errors occurred. Check
                    console for details.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
             <AlertDialogAction onClick={() => setImportResult(null)} className="rounded-lg">
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
