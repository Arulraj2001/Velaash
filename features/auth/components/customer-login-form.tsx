"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui";
import {
  sendOtpAction,
  verifyOtpAction,
  signInWithGoogleAction,
  updateCustomerProfileAction,
} from "../actions/customer-auth.actions";
import {
  Mail,
  KeyRound,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
} from "lucide-react";

type FormStep = "EMAIL" | "OTP" | "PROFILE_NAME";

export function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/account";

  const [step, setStep] = React.useState<FormStep>("EMAIL");
  const [email, setEmail] = React.useState("");
  const [otpToken, setOtpToken] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Cooldown timer for resend OTP
  const [resendCooldown, setResendCooldown] = React.useState(0);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Step 1: Send OTP code
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await sendOtpAction({ email });
      if (!res.success) {
        setError(res.error || "Unable to send verification code. Please try again.");
        return;
      }

      setSuccessMessage(res.message || "A 6-digit code has been sent to your email.");
      setStep("OTP");
      setResendCooldown(60);
    } catch {
      setError("An unexpected connection issue occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await verifyOtpAction({
        email,
        token: otpToken.trim(),
        fullName: fullName.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "The code entered is invalid or has expired.");
        return;
      }

      if (res.requiresName) {
        setStep("PROFILE_NAME");
        setSuccessMessage("Code verified! Please provide your name to personalize your orders.");
        return;
      }

      setSuccessMessage("Welcome back to Velaash! Redirecting...");
      setTimeout(() => {
        router.push(returnUrl);
        router.refresh();
      }, 800);
    } catch {
      setError("Failed to verify code. Please check your network and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Complete profile name
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("fullName", fullName);
    if (phone) formData.append("phone", phone);

    try {
      const res = await updateCustomerProfileAction(formData);
      if (!res.success) {
        setError(res.error || "Failed to update profile name.");
        return;
      }

      setSuccessMessage("Profile saved! Entering your bespoke sanctuary...");
      setTimeout(() => {
        router.push(returnUrl);
        router.refresh();
      }, 800);
    } catch {
      setError("Unable to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth sign-in
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      const res = await signInWithGoogleAction(returnUrl);
      if (!res.success || !res.data?.url) {
        setError(res.error || "Google authentication could not be initialized.");
        setIsGoogleLoading(false);
        return;
      }

      // Redirect browser to Supabase Google OAuth provider URL
      window.location.href = res.data.url;
    } catch {
      setError("Unable to initiate Google sign-in. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="border-brand-border/80 shadow-luxury bg-brand-card mx-auto w-full max-w-md overflow-hidden">
      <CardHeader className="p-6 pb-4 text-center sm:p-8">
        <div className="bg-brand-light/40 border-brand-gold/40 text-brand-accent mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border">
          {step === "PROFILE_NAME" ? (
            <UserCheck className="h-6 w-6" />
          ) : step === "OTP" ? (
            <KeyRound className="h-6 w-6" />
          ) : (
            <Sparkles className="h-6 w-6" />
          )}
        </div>
        <CardTitle className="font-heading text-brand-dark text-2xl sm:text-3xl">
          {step === "PROFILE_NAME"
            ? "Personalize Your Vault"
            : step === "OTP"
              ? "Enter Verification Code"
              : "Sign In to Velaash"}
        </CardTitle>
        <CardDescription className="text-brand-dark/70 mx-auto max-w-xs text-xs">
          {step === "PROFILE_NAME"
            ? "Tell us how our master tailors and stylists should address you."
            : step === "OTP"
              ? `We sent a 6-digit access code to ${email}`
              : "Instant access via mobile-friendly email OTP or Google. No password required."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 p-6 pt-2 sm:p-8">
        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50/90 p-3.5 text-xs text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && !error && (
          <div className="flex items-start gap-2.5 rounded-md border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <p className="flex-1">{successMessage}</p>
          </div>
        )}

        {/* STEP 1: Email Form */}
        {step === "EMAIL" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              id="customer-email"
              type="email"
              label="Email Address"
              placeholder="e.g. ananya@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
              helperText="We will send a fast 6-digit access code to your inbox"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Send Access Code
            </Button>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="border-brand-border/60 w-full border-t" />
              </div>
              <span className="bg-brand-card text-brand-dark/50 relative px-3 text-[11px] tracking-wider uppercase">
                Or continue with
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full font-medium"
              onClick={handleGoogleSignIn}
              isLoading={isGoogleLoading}
              leftIcon={
                <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              }
            >
              Sign In with Google
            </Button>
          </form>
        )}

        {/* STEP 2: OTP Entry Form */}
        {step === "OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="flex items-center justify-between pb-1 text-xs">
              <span className="text-brand-dark/70 max-w-[220px] truncate">
                To: <span className="text-brand-dark font-semibold">{email}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setStep("EMAIL");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-brand-accent text-[11px] font-medium hover:underline"
              >
                Change email
              </button>
            </div>

            <Input
              id="otp-token"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              label="6-Digit Verification Code"
              placeholder="000000"
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              autoFocus
              className="text-center font-mono text-xl font-bold tracking-[0.5em]"
              leftIcon={<KeyRound className="h-4 w-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              disabled={otpToken.length !== 6}
            >
              Verify & Enter Sanctuary
            </Button>

            <div className="pt-2 text-center">
              {resendCooldown > 0 ? (
                <p className="text-brand-dark/50 text-xs">
                  Resend code in{" "}
                  <span className="text-brand-accent font-mono font-bold">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="text-brand-accent hover:text-brand-accent-hover inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Didn&apos;t receive code? Resend OTP
                </button>
              )}
            </div>
          </form>
        )}

        {/* STEP 3: Complete Profile Name */}
        {step === "PROFILE_NAME" && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              id="customer-fullname"
              label="Your Full Name"
              placeholder="e.g. Radhika Singhal"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
              helperText="For order invoicing and bespoke fitting records"
            />

            <Input
              id="customer-phone"
              type="tel"
              label="Mobile Number (Optional)"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              helperText="For express delivery and WhatsApp order tracking updates"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              disabled={fullName.trim().length < 2}
            >
              Save & Enter Boutique
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="bg-brand-cream/40 border-brand-border/60 border-t p-4 text-center">
        <p className="text-brand-dark/60 w-full font-sans text-[11px] leading-relaxed">
          Guest checkout is always welcome. Account sign-in is required only to view saved
          addresses, track couture orders, or maintain your wishlist.
        </p>
      </CardFooter>
    </Card>
  );
}
