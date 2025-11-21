"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className, width = 24, height = 24 }: LogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which logo to use
  // If theme is dark, use dark.png, otherwise use light.png
  // Also handle blue and green themes (they're light themes)
  const currentTheme = theme || "light";
  const isDark = currentTheme === "dark";
  const logoSrc = isDark ? "/logo/dark.png" : "/logo/light.png";

  if (!mounted) {
    // Return a placeholder with same dimensions to prevent layout shift
    return (
      <div
        className={cn("relative shrink-0", className)}
        style={{ width, height }}
        aria-hidden="true"
      />
    );
  }

  return (
    <Image
      src={logoSrc}
      alt="IW Expense Tracker Logo"
      width={width}
      height={height}
      className={cn("object-contain shrink-0", className)}
      priority
    />
  );
}

