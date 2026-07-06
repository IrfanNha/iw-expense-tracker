"use client";

import { useState } from "react";
import { User, Lock, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileTab } from "./ProfileTab";
import { SecurityTab } from "./SecurityTab";
import { DataTab } from "./DataTab";
import { cn } from "@/lib/utils";

type TabId = "profile" | "security" | "data";

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="space-y-6">
      {/* Pill Tabs Navigation */}
      <div className="flex p-1 bg-muted/60 rounded-lg max-w-fit">
        <Button
          variant={activeTab === "profile" ? "default" : "ghost"}
          size="sm"
          className={cn(
            "rounded-md gap-2 h-9 text-xs md:text-sm px-4",
            activeTab === "profile" ? "shadow-sm" : ""
          )}
          onClick={() => setActiveTab("profile")}
        >
          <User className="h-4 w-4" />
          Profile
        </Button>
        <Button
          variant={activeTab === "security" ? "default" : "ghost"}
          size="sm"
          className={cn(
            "rounded-md gap-2 h-9 text-xs md:text-sm px-4",
            activeTab === "security" ? "shadow-sm" : ""
          )}
          onClick={() => setActiveTab("security")}
        >
          <Lock className="h-4 w-4" />
          Security
        </Button>
        <Button
          variant={activeTab === "data" ? "default" : "ghost"}
          size="sm"
          className={cn(
            "rounded-md gap-2 h-9 text-xs md:text-sm px-4",
            activeTab === "data" ? "shadow-sm" : ""
          )}
          onClick={() => setActiveTab("data")}
        >
          <Database className="h-4 w-4" />
          Data
        </Button>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "data" && <DataTab />}
      </div>
    </div>
  );
}
