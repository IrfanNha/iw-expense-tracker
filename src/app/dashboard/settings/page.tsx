import { Metadata } from "next";
import { SettingsTabs } from "./_components/SettingsTabs";

export const metadata: Metadata = {
  title: "Settings - IW Expense",
  description: "Manage your account settings, PIN, and data backups.",
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-4 pt-4 pb-12 md:px-6 md:pt-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
          Manage your profile, security, and application data.
        </p>
      </div>

      {/* Tabs / Content */}
      <SettingsTabs />
    </div>
  );
}
