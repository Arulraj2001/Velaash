"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui";
import { signInAdminAction } from "../actions/admin-auth.actions";
import { ShieldCheck, Lock, Mail, AlertTriangle, ArrowRight } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/admin";
  const urlError = searchParams.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    urlError === "unauthorized" ? "Access denied. Administrative authorization required." : null
  );
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await signInAdminAction({ email, password });
      if (!res.success) {
        setError(res.error || "Access denied. Invalid credentials.");
        return;
      }

      setSuccess(res.message || "Authorized. Accessing administrative console...");
      setTimeout(() => {
        router.push(returnUrl);
        router.refresh();
      }, 700);
    } catch {
      setError("Access denied. Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-brand-accent/30 bg-brand-dark text-brand-cream mx-auto w-full max-w-md overflow-hidden shadow-2xl">
      <CardHeader className="p-6 pb-4 text-center sm:p-8">
        <div className="bg-brand-accent/20 border-brand-gold/30 text-brand-gold mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="font-heading text-brand-gold text-2xl sm:text-3xl">
          Administrative Console Gate
        </CardTitle>
        <CardDescription className="text-brand-cream/60 mx-auto max-w-xs text-xs">
          Restricted to authorized staff & store administrators only.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 p-6 pt-2 sm:p-8">
        {error && (
          <div className="flex items-start gap-2.5 rounded-md border border-red-500/40 bg-red-950/60 p-3.5 text-xs text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {success && !error && (
          <div className="flex items-start gap-2.5 rounded-md border border-emerald-500/40 bg-emerald-950/60 p-3.5 text-xs text-emerald-200">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <p className="flex-1">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="admin-email"
              className="text-brand-gold block text-xs font-medium tracking-wider uppercase"
            >
              Staff Email Address
            </label>
            <div className="relative flex items-center">
              <div className="text-brand-cream/40 pointer-events-none absolute left-3 flex items-center">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="admin-email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@velaash.com"
                className="border-brand-accent/40 bg-brand-dark-muted/80 text-brand-cream placeholder:text-brand-cream/30 focus-visible:border-brand-gold focus-visible:ring-brand-gold/30 flex h-11 w-full rounded-md border py-2 pr-3.5 pl-10 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="admin-password"
              className="text-brand-gold block text-xs font-medium tracking-wider uppercase"
            >
              Master Password
            </label>
            <div className="relative flex items-center">
              <div className="text-brand-cream/40 pointer-events-none absolute left-3 flex items-center">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="border-brand-accent/40 bg-brand-dark-muted/80 text-brand-cream placeholder:text-brand-cream/30 focus-visible:border-brand-gold focus-visible:ring-brand-gold/30 flex h-11 w-full rounded-md border py-2 pr-3.5 pl-10 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="mt-2 w-full"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Authenticate & Access Console
          </Button>
        </form>
      </CardContent>

      <CardFooter className="bg-brand-dark-muted/40 border-brand-accent/20 border-t p-4 text-center">
        <p className="text-brand-cream/50 w-full font-mono text-[11px]">
          Security Audit Enabled • All Login Attempts Logged
        </p>
      </CardFooter>
    </Card>
  );
}
