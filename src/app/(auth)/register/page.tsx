"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { registerSchema } from "@/lib/validators";
import { Turnstile, TurnstileRef } from "@/components/Turnstile";
import Link from "next/link";
import { Wallet, User, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type FormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileRef | null>(null);

  // Check if Turnstile should be disabled (development mode)
  const isDevelopment = process.env.NEXT_PUBLIC_APP_ENV === "development" || 
                        process.env.NODE_ENV === "development";

  const form = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      pin: "",
    },
  });

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

      // Proceed with registration
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...data, 
          ...(isDevelopment ? {} : { turnstileToken }) 
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        // Handle specific error messages
        if (result.error?.includes("already exists")) {
          setError("An account with this email already exists. Please login instead.");
        } else if (result.error?.includes("Invalid input")) {
          setError(result.details?.[0]?.message || "Invalid input. Please check your information.");
        } else {
          setError(result.error || "Registration failed. Please try again.");
        }
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
        setTurnstileToken(null);
        return;
      }

      // Redirect to login
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setTurnstileToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-zinc-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 mb-4">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-muted-foreground">
            Start tracking your expenses today
          </p>
        </div>

        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl">Register</CardTitle>
            <CardDescription>
              Fill in your information to create an account
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

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  {...form.register("name")}
                  autoComplete="name"
                  className={cn(
                    "h-11 transition-all",
                    form.formState.errors.name && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={isLoading}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

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
                  PIN (6-10 digits)
                </Label>
                <PasswordInput
                  id="pin"
                  placeholder="Enter a secure PIN"
                  {...form.register("pin")}
                  autoComplete="new-password"
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
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Choose a PIN with 6-10 digits. Keep it secure!
                </p>
              </div>

              <div className="pt-2">
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
                    <span className="mr-2">Creating account...</span>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </>
                ) : (
                  "Register"
                )}
              </Button>

              <div className="text-center text-sm pt-2">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link 
                  href="/login" 
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

