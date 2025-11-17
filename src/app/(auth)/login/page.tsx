"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { loginSchema } from "@/lib/validators";
import { Turnstile, TurnstileRef } from "@/components/features/Turnstile";
import Link from "next/link";
import { Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type FormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileRef | null>(null);

  // Check if Turnstile should be disabled (development mode)
  const isDevelopment = process.env.NEXT_PUBLIC_APP_ENV === "development" || 
                        process.env.NODE_ENV === "development";

  const form = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      pin: "",
    },
  });

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Registration successful! Please login with your credentials.");
    }
  }, [searchParams]);

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    setError(null);
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setError("Please complete the security verification");
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Skip Turnstile validation in development
    if (!isDevelopment) {
      // Validate Turnstile token
      if (!turnstileToken) {
        setError("Please complete the security verification");
        setIsLoading(false);
        return;
      }

      try {
        // Verify Turnstile token
        const verifyRes = await fetch("/api/turnstile/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: turnstileToken }),
        });

        if (!verifyRes.ok) {
          const verifyError = await verifyRes.json();
          setError(verifyError.error || "Security verification failed. Please try again.");
          if (turnstileRef.current) {
            turnstileRef.current.reset();
          }
          setTurnstileToken(null);
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        setError(err.message || "Security verification failed. Please try again.");
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
        setTurnstileToken(null);
        setIsLoading(false);
        return;
      }
    }

    try {
      // Proceed with login
      console.log("Attempting login for:", data.email);
      const result = await signIn("credentials", {
        email: data.email,
        pin: data.pin,
        redirect: false,
      });

      console.log("SignIn result:", result);

      // Handle response - check for error first
      if (result?.error) {
        console.error("Login error:", result.error);
        setError("Invalid email or PIN. Please check your credentials and try again.");
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
        setTurnstileToken(null);
        setIsLoading(false);
        return;
      }

      // If successful (ok === true or no error), redirect
      if (result && (result.ok === true || result.error === undefined)) {
        console.log("Login successful, redirecting...");
        // Use window.location for more reliable redirect in production
        window.location.href = "/dashboard";
        return;
      }

      // If result is null/undefined, might be a silent failure
      if (!result) {
        console.error("SignIn returned null/undefined");
        setError("Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Fallback redirect
      console.log("Fallback redirect");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred. Please try again.");
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setTurnstileToken(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-zinc-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary/10 dark:bg-primary/20 mb-4">
            <Image
              src="/logo/light.png"
              alt="IW Expense Tracker Logo"
              width={64}
              height={64}
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain dark:hidden"
              priority
            />
            <Image
              src="/logo/dark.png"
              alt="IW Expense Tracker Logo"
              width={64}
              height={64}
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain hidden dark:block"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            IW Expense Tracker
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            irfanwork
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground pt-2">
            Sign in to your account to continue
          </p>
        </div>

        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive flex-1">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-600 dark:text-green-400 flex-1">{success}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...form.register("email")}
                  autoComplete="email"
                  className={cn(
                    "h-11 transition-all",
                    form.formState.errors.email && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={isLoading}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  PIN
                </Label>
                <PasswordInput
                  id="pin"
                  placeholder="Enter your PIN"
                  {...form.register("pin")}
                  autoComplete="current-password"
                  maxLength={10}
                  className={cn(
                    "h-11 transition-all",
                    form.formState.errors.pin && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={isLoading}
                />
                {form.formState.errors.pin && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {form.formState.errors.pin.message}
                  </p>
                )}
              </div>

              <div className="pt-2 w-full">
                <Turnstile
                  ref={turnstileRef}
                  onVerify={handleTurnstileVerify}
                  onError={handleTurnstileError}
                  onExpire={handleTurnstileExpire}
                  theme="auto"
                  size="normal"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold" 
                disabled={isLoading || (!isDevelopment && !turnstileToken)}
              >
                {isLoading ? (
                  <>
                    <span className="mr-2">Logging in...</span>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </>
                ) : (
                  "Login"
                )}
              </Button>

              <div className="text-center text-sm pt-2">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link 
                  href="/register" 
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Register
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

