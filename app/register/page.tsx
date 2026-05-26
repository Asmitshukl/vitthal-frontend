"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";

type Step = "register" | "verify";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Registration data preserved across steps
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredName, setRegisteredName] = useState("");

  // OTP verification states
  const [otp, setOtp] = useState("");
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
  const [isResendingOTP, setIsResendingOTP] = useState(false);

  const hasMinLength = password.length >= 7;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isPasswordStrong =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) {
      return true;
    }
    return password === confirmPassword;
  }, [password, confirmPassword]);

  // Registration handler — creates account and triggers OTP
  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordsMatch || !isPasswordStrong) {
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const passwordValue = formData.get("password") as string;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "client",
          },
          credentials: "include",
          body: JSON.stringify({
            name,
            email,
            password: passwordValue,
            role: "client",
          }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        setRegisteredEmail(email);
        setRegisteredName(name);
        if (data.expiresAt) {
          setOtpExpiry(new Date(data.expiresAt));
        }
        setStep("verify");
        toast.success(data.message || "OTP sent to your email");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Resend OTP handler
  async function handleResendOTP() {
    setIsResendingOTP(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "x-request-from": "client",
          },
          credentials: "include",
          body: JSON.stringify({
            name: registeredName,
            email: registeredEmail,
            password,
            role: "client",
          }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        setOtp("");
        if (data.expiresAt) {
          setOtpExpiry(new Date(data.expiresAt));
        }
        toast.success("OTP resent to your email");
      } else {
        toast.error(data.message || "Failed to resend OTP");
      }
    } catch {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsResendingOTP(false);
    }
  }

  // Verify OTP handler — verifies and completes registration
  async function handleVerifyOTP() {
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setIsVerifyingOTP(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "client",
          },
          credentials: "include",
          body: JSON.stringify({ email: registeredEmail, otp }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Registration complete!");
        if (data.user) {
          useAuthStore.getState().setUser(data.user);
        }
        toast.success("Please complete your profile setup first");
        router.replace("/profile/setup");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch {
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setIsVerifyingOTP(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-xl font-semibold justify-center items-center flex tracking-tight text-zinc-900"
          >
            <Image
              src={"/favicon.ico"}
              height="104"
              width="100"
              alt="MTWO Logo"
            />
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900">
            {step === "register" ? "Create your account" : "Verify your email"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {step === "register"
              ? "Join as a buyer and source industrial products from trusted vendors."
              : `Enter the OTP sent to ${registeredEmail}`}
          </p>
        </div>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
          {step === "register" ? (
            <form onSubmit={handleRegister} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  autoComplete="name"
                  placeholder="Your full name"
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={7}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a strong password"
                    aria-invalid={!isPasswordStrong && password.length > 0}
                    className="h-11 w-full rounded-md border border-zinc-300 px-3 pr-10 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-700"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <p
                    className={
                      hasMinLength ? "text-emerald-600" : "text-zinc-500"
                    }
                  >
                    At least 7 characters
                  </p>
                  <p
                    className={
                      hasUppercase ? "text-emerald-600" : "text-zinc-500"
                    }
                  >
                    Contains an uppercase letter
                  </p>
                  <p
                    className={
                      hasLowercase ? "text-emerald-600" : "text-zinc-500"
                    }
                  >
                    Contains a lowercase letter
                  </p>
                  <p
                    className={hasNumber ? "text-emerald-600" : "text-zinc-500"}
                  >
                    Contains at least 1 number
                  </p>
                  <p
                    className={
                      hasSpecialChar ? "text-emerald-600" : "text-zinc-500"
                    }
                  >
                    Contains at least 1 special character
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={7}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    aria-invalid={!passwordsMatch}
                    className="h-11 w-full rounded-md border border-zinc-300 px-3 pr-10 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-700"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {!passwordsMatch ? (
                  <p className="mt-1.5 text-xs text-red-600">
                    Passwords do not match.
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !passwordsMatch || !isPasswordStrong}
                className="h-11 w-full rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-2 text-sm text-zinc-600">
                  Enter the 6-digit OTP sent to your email
                  {otpExpiry && (
                    <span className="block text-xs text-zinc-500 mt-1">
                      Expires at {otpExpiry.toLocaleTimeString()}
                    </span>
                  )}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setOtp(value);
                    }}
                    className="h-11 flex-1 rounded-md border border-zinc-300 px-3 text-center text-lg font-medium tracking-widest text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                  <button
                    onClick={handleVerifyOTP}
                    disabled={otp.length !== 6 || isVerifyingOTP}
                    className="h-11 whitespace-nowrap rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isVerifyingOTP ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              </div>

              <button
                onClick={handleResendOTP}
                disabled={isResendingOTP}
                className="h-11 w-full rounded-md bg-zinc-800 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResendingOTP ? "Resending..." : "Resend OTP"}
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#1d4ed8] hover:text-[#1e40af]"
            >
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
