"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts, type Account } from "@/hooks/useAccounts";
import { formatCurrency } from "@/lib/money";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  excludeAccountId?: string;
  placeholder?: string;
  className?: string;
}

export function AccountSelect({
  value,
  onValueChange,
  excludeAccountId,
  placeholder = "Select account",
  className,
}: AccountSelectProps) {
  const { data: accounts, isLoading } = useAccounts();

  const filteredAccounts = React.useMemo(() => {
    if (!accounts) return [];
    return excludeAccountId
      ? accounts.filter((acc) => acc.id !== excludeAccountId)
      : accounts;
  }, [accounts, excludeAccountId]);

  const selectedAccount = accounts?.find((acc) => acc.id === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder}>
          {selectedAccount && (
            <div className="flex items-center gap-2">
              {selectedAccount.icon && Icons[selectedAccount.icon as keyof typeof Icons] ? (
                React.createElement(Icons[selectedAccount.icon as keyof typeof Icons] as unknown as React.ComponentType<{ className?: string }>, {
                  className: "h-4 w-4",
                })
              ) : (
                <Icons.Wallet className="h-4 w-4" />
              )}
              <span>{selectedAccount.name}</span>
              <span className="text-muted-foreground ml-auto">
                {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
              </span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {filteredAccounts.map((account) => {
          const IconComponent = (account.icon && Icons[account.icon as keyof typeof Icons]
            ? Icons[account.icon as keyof typeof Icons]
            : Icons.Wallet) as unknown as React.ComponentType<{ className?: string }>;
          
          return (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center gap-2 w-full">
                <IconComponent className="h-4 w-4" />
                <span className="flex-1">{account.name}</span>
                <span className="text-muted-foreground text-xs">
                  {formatCurrency(account.balance, account.currency)}
                </span>
              </div>
            </SelectItem>
          );
        })}
        {filteredAccounts.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No accounts available
          </div>
        )}
      </SelectContent>
    </Select>
  );
}

