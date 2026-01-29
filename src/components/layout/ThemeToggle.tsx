"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Palette, BoxIcon } from "lucide-react";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "green", label: "Green", icon: Palette },
  { value: "blue", label: "Blue", icon: BoxIcon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  // Use resolvedTheme as fallback to ensure we always have a valid theme
  const currentThemeValue = theme || resolvedTheme || "light";
  const currentTheme = themes.find((t) => t.value === currentThemeValue) || themes[0];
  const CurrentIcon = currentTheme.icon;

  const handleThemeChange = (newTheme: string) => {
    // Force theme change by first setting to a different theme if necessary
    // This ensures the class is properly removed and re-added
    if (theme === newTheme) return;
    
    setTheme(newTheme);
    
    // Force a small delay to ensure DOM updates
    setTimeout(() => {
      // Trigger a reflow to ensure CSS is recalculated
      document.documentElement.offsetHeight;
    }, 0);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = currentThemeValue === themeOption.value;
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => handleThemeChange(themeOption.value)}
              className={`flex items-center gap-2 ${isActive ? "bg-accent" : ""}`}
            >
              <Icon className="h-4 w-4" />
              <span>{themeOption.label}</span>
              {isActive && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
