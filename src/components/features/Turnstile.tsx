"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
}

export interface TurnstileRef {
  reset: () => void;
}

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(({
  onVerify,
  onError,
  onExpire,
  theme = "auto",
  size: propSize = "normal",
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Use compact size on mobile, otherwise use prop size
  const size = isMobile ? "compact" : propSize;

  // Check if Turnstile should be disabled (development mode)
  const isDevelopment = process.env.NEXT_PUBLIC_APP_ENV === "development" || 
                        process.env.NODE_ENV === "development";

  const reset = () => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        setError(null);
      } catch (e) {
        console.error("Turnstile reset error:", e);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    reset,
  }));

  // Auto-verify in development mode
  useEffect(() => {
    if (isDevelopment) {
      // Simulate successful verification in development
      onVerify("development-bypass-token");
      setIsLoaded(true);
      return;
    }
  }, [isDevelopment, onVerify]);

  useEffect(() => {
    // Skip loading Turnstile in development
    if (isDevelopment) {
      return;
    }

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      setError("Turnstile site key is not configured");
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]')) {
      setIsLoaded(true);
      return;
    }

    // Load Turnstile script
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError("Failed to load Turnstile script");
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  useEffect(() => {
    // Skip rendering in development
    if (isDevelopment) {
      return;
    }

    if (!isLoaded || !containerRef.current || widgetIdRef.current) return;

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !window.turnstile) return;

    try {
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onVerify(token);
          setError(null);
        },
        "error-callback": () => {
          setError("Verification failed");
          onError?.();
        },
        "expired-callback": () => {
          setError("Token expired");
          onExpire?.();
        },
        theme,
        size,
      });

      widgetIdRef.current = widgetId;
    } catch (e) {
      setError("Failed to render Turnstile");
      console.error("Turnstile render error:", e);
    }
  }, [isLoaded, onVerify, onError, onExpire, theme, size, isDevelopment]);

  // Don't render anything in development
  if (isDevelopment) {
    return null;
  }

  if (error && !isLoaded) {
    return (
      <div className="text-sm text-destructive text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div 
        ref={containerRef} 
        className="flex justify-center w-full transform transition-transform"
        style={{
          transform: isMobile ? 'scale(0.85)' : 'scale(1)',
          transformOrigin: 'center',
        }}
      />
      {error && isLoaded && (
        <p className="text-xs text-destructive mt-2 text-center">{error}</p>
      )}
    </div>
  );
});

Turnstile.displayName = "Turnstile";

