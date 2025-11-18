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
 * Sanitize value for CSV - ensures safe output
 */
function sanitizeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  
  // Convert to string
  const str = String(value);
  
  // Remove or replace problematic characters
  const sanitized = str
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
    .trim();
  
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (sanitized.includes(",") || sanitized.includes("\n") || sanitized.includes('"') || sanitized.includes("\r")) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  
  return sanitized;
}

/**
 * Sanitize numeric value - returns empty string if invalid
 */
function sanitizeNumeric(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  
  // Try to parse as number
  const num = typeof value === "number" ? value : parseFloat(String(value));
  
  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    return ""; // Return empty for invalid numbers
  }
  
  // Ensure it's an integer (for cents)
  const intValue = Math.round(num);
  
  return String(intValue);
}

/**
 * Sanitize date value - returns empty string if invalid
 */
function sanitizeDate(value: any): string {
  if (!value) {
    return "";
  }
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString();
  } catch {
    return "";
  }
}

/**
 * Convert array of objects to CSV string with sanitization
 */
function arrayToCSV(data: any[], headers: string[], sanitizers?: Record<string, (val: any) => string>): string {
  if (data.length === 0) {
    return headers.join(",") + "\n";
  }

  const rows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const sanitizer = sanitizers?.[header];
          
          if (sanitizer) {
            return sanitizer(value);
          }
          
          return sanitizeCSVValue(value);
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
 * Export data to CSV format with sanitization
 */
export function exportToCSV(data: ExportData): string {
  const sections: string[] = [];

  // Export Accounts
  if (data.accounts.length > 0) {
    sections.push("=== ACCOUNTS ===");
    sections.push(
      arrayToCSV(
        data.accounts,
        ["name", "type", "currency", "icon", "balance"],
        {
          balance: sanitizeNumeric,
        }
      )
    );
    sections.push("");
  }

  // Export Categories
  if (data.categories.length > 0) {
    sections.push("=== CATEGORIES ===");
    sections.push(
      arrayToCSV(
        data.categories,
        ["name", "isIncome", "icon"],
        {
          isIncome: (val) => val === true || val === "true" ? "true" : "false",
        }
      )
    );
    sections.push("");
  }

  // Export Transactions
  if (data.transactions.length > 0) {
    sections.push("=== TRANSACTIONS ===");
    sections.push(
      arrayToCSV(
        data.transactions,
        [
          "accountName",
          "categoryName",
          "amount",
          "type",
          "note",
          "occurredAt",
        ],
        {
          amount: sanitizeNumeric,
          type: (val) => val === "INCOME" || val === "EXPENSE" ? String(val) : "",
          occurredAt: sanitizeDate,
        }
      )
    );
    sections.push("");
  }

  // Export Transfers
  if (data.transfers.length > 0) {
    sections.push("=== TRANSFERS ===");
    sections.push(
      arrayToCSV(
        data.transfers,
        [
          "fromAccountName",
          "toAccountName",
          "amount",
          "note",
          "createdAt",
        ],
        {
          amount: sanitizeNumeric,
          createdAt: sanitizeDate,
        }
      )
    );
  }

  return sections.join("\n");
}

/**
 * Sanitize and validate numeric value for import
 */
function parseSafeNumber(value: any, defaultValue: number = 0): number {
  if (!value || value === "") {
    return defaultValue;
  }
  
  const cleaned = String(value).replace(/[^\d.-]/g, "");
  if (!cleaned) {
    return defaultValue;
  }
  
  const num = parseFloat(cleaned);
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  
  // Ensure it's an integer (for cents)
  return Math.round(num);
}

/**
 * Sanitize and validate date value for import
 */
function parseSafeDate(value: any, defaultValue?: Date): string {
  if (!value || value === "") {
    return defaultValue ? defaultValue.toISOString() : new Date().toISOString();
  }
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return defaultValue ? defaultValue.toISOString() : new Date().toISOString();
    }
    return date.toISOString();
  } catch {
    return defaultValue ? defaultValue.toISOString() : new Date().toISOString();
  }
}

/**
 * Sanitize string value for import
 */
function parseSafeString(value: any, maxLength: number = 255): string {
  if (!value) {
    return "";
  }
  
  const str = String(value)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
    .trim();
  
  return str.slice(0, maxLength);
}

/**
 * Validate transaction type
 */
function validateTransactionType(value: any): "INCOME" | "EXPENSE" {
  const str = String(value).toUpperCase().trim();
  return str === "INCOME" ? "INCOME" : "EXPENSE";
}

/**
 * Validate account type
 */
function validateAccountType(value: any): string {
  const validTypes = ["CASH", "BANK", "CARD", "E_WALLET", "OTHER"];
  const str = String(value).toUpperCase().trim();
  return validTypes.includes(str) ? str : "CASH";
}

/**
 * Import data from CSV format with sanitization
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
          result.accounts = csvToArray(sectionData)
            .map((row) => {
              const name = parseSafeString(row.name, 100);
              if (!name) return null; // Skip if name is empty
              
              return {
                name,
                type: validateAccountType(row.type),
                currency: parseSafeString(row.currency || "IDR", 10).toUpperCase() || "IDR",
                icon: row.icon ? parseSafeString(row.icon, 50) : undefined,
                balance: parseSafeNumber(row.balance, 0),
              };
            })
            .filter((acc): acc is NonNullable<typeof acc> => acc !== null);
          break;

        case "categories":
          result.categories = csvToArray(sectionData)
            .map((row) => {
              const name = parseSafeString(row.name, 100);
              if (!name) return null; // Skip if name is empty
              
              return {
                name,
                isIncome: row.isIncome === "true" || row.isIncome === true || String(row.isIncome).toLowerCase() === "true",
                icon: row.icon ? parseSafeString(row.icon, 50) : undefined,
              };
            })
            .filter((cat): cat is NonNullable<typeof cat> => cat !== null);
          break;

        case "transactions":
          result.transactions = csvToArray(sectionData)
            .map((row) => {
              const accountName = parseSafeString(row.accountName, 100);
              if (!accountName) return null; // Skip if account name is empty
              
              const amount = parseSafeNumber(row.amount);
              if (amount <= 0) return null; // Skip if amount is invalid
              
              return {
                accountName,
                categoryName: row.categoryName ? parseSafeString(row.categoryName, 100) : undefined,
                amount,
                type: validateTransactionType(row.type),
                note: row.note ? parseSafeString(row.note, 500) : undefined,
                occurredAt: parseSafeDate(row.occurredAt),
              };
            })
            .filter((tx): tx is NonNullable<typeof tx> => tx !== null);
          break;

        case "transfers":
          result.transfers = csvToArray(sectionData)
            .map((row) => {
              const fromAccountName = parseSafeString(row.fromAccountName, 100);
              const toAccountName = parseSafeString(row.toAccountName, 100);
              
              if (!fromAccountName || !toAccountName) return null; // Skip if account names are empty
              if (fromAccountName === toAccountName) return null; // Skip if same account
              
              const amount = parseSafeNumber(row.amount);
              if (amount <= 0) return null; // Skip if amount is invalid
              
              return {
                fromAccountName,
                toAccountName,
                amount,
                note: row.note ? parseSafeString(row.note, 500) : undefined,
                createdAt: parseSafeDate(row.createdAt),
              };
            })
            .filter((transfer): transfer is NonNullable<typeof transfer> => transfer !== null);
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

