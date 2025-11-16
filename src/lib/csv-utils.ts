/**
 * CSV Utility Functions for Export/Import
 */

export interface ExportData {
  accounts: Array<{
    name: string;
    type: string;
    currency: string;
    icon?: string | null;
    balance: number;
  }>;
  categories: Array<{
    name: string;
    isIncome: boolean;
    icon?: string | null;
  }>;
  transactions: Array<{
    accountName: string;
    categoryName?: string | null;
    amount: number;
    type: string;
    note?: string | null;
    occurredAt: string;
  }>;
  transfers: Array<{
    fromAccountName: string;
    toAccountName: string;
    amount: number;
    note?: string | null;
    createdAt: string;
  }>;
}

export interface ImportData {
  accounts: Array<{
    name: string;
    type: string;
    currency: string;
    icon?: string;
    balance?: number;
  }>;
  categories: Array<{
    name: string;
    isIncome: boolean;
    icon?: string;
  }>;
  transactions: Array<{
    accountName: string;
    categoryName?: string;
    amount: number;
    type: string;
    note?: string;
    occurredAt: string;
  }>;
  transfers: Array<{
    fromAccountName: string;
    toAccountName: string;
    amount: number;
    note?: string;
    createdAt: string;
  }>;
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: any[], headers: string[]): string {
  if (data.length === 0) {
    return headers.join(",") + "\n";
  }

  const rows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? "";
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          if (typeof value === "string" && (value.includes(",") || value.includes("\n") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ];

  return rows.join("\n");
}

/**
 * Parse CSV string to array of objects
 */
function csvToArray(csv: string): any[] {
  const lines = csv.trim().split("\n");
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          j++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add last value

    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExportData): string {
  const sections: string[] = [];

  // Export Accounts
  if (data.accounts.length > 0) {
    sections.push("=== ACCOUNTS ===");
    sections.push(
      arrayToCSV(data.accounts, ["name", "type", "currency", "icon", "balance"])
    );
    sections.push("");
  }

  // Export Categories
  if (data.categories.length > 0) {
    sections.push("=== CATEGORIES ===");
    sections.push(
      arrayToCSV(data.categories, ["name", "isIncome", "icon"])
    );
    sections.push("");
  }

  // Export Transactions
  if (data.transactions.length > 0) {
    sections.push("=== TRANSACTIONS ===");
    sections.push(
      arrayToCSV(data.transactions, [
        "accountName",
        "categoryName",
        "amount",
        "type",
        "note",
        "occurredAt",
      ])
    );
    sections.push("");
  }

  // Export Transfers
  if (data.transfers.length > 0) {
    sections.push("=== TRANSFERS ===");
    sections.push(
      arrayToCSV(data.transfers, [
        "fromAccountName",
        "toAccountName",
        "amount",
        "note",
        "createdAt",
      ])
    );
  }

  return sections.join("\n");
}

/**
 * Import data from CSV format
 */
export function importFromCSV(csv: string): ImportData {
  const sections = csv.split(/=== (\w+) ===/);
  const result: ImportData = {
    accounts: [],
    categories: [],
    transactions: [],
    transfers: [],
  };

  for (let i = 1; i < sections.length; i += 2) {
    const sectionName = sections[i]?.trim().toLowerCase();
    const sectionData = sections[i + 1]?.trim();

    if (!sectionData) continue;

    try {
      switch (sectionName) {
        case "accounts":
          result.accounts = csvToArray(sectionData).map((row) => ({
            name: row.name || "",
            type: row.type || "CASH",
            currency: row.currency || "IDR",
            icon: row.icon || undefined,
            balance: row.balance ? parseInt(row.balance, 10) : 0,
          }));
          break;

        case "categories":
          result.categories = csvToArray(sectionData).map((row) => ({
            name: row.name || "",
            isIncome: row.isIncome === "true" || row.isIncome === true,
            icon: row.icon || undefined,
          }));
          break;

        case "transactions":
          result.transactions = csvToArray(sectionData).map((row) => ({
            accountName: row.accountName || "",
            categoryName: row.categoryName || undefined,
            amount: parseInt(row.amount, 10) || 0,
            type: row.type || "EXPENSE",
            note: row.note || undefined,
            occurredAt: row.occurredAt || new Date().toISOString(),
          }));
          break;

        case "transfers":
          result.transfers = csvToArray(sectionData).map((row) => ({
            fromAccountName: row.fromAccountName || "",
            toAccountName: row.toAccountName || "",
            amount: parseInt(row.amount, 10) || 0,
            note: row.note || undefined,
            createdAt: row.createdAt || new Date().toISOString(),
          }));
          break;
      }
    } catch (error) {
      console.error(`Error parsing ${sectionName}:`, error);
    }
  }

  return result;
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

