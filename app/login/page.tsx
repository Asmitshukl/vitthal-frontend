"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  const hasMinLength = password.length >= 7;
  const hasNumber = /\d/.test(password);
  const isPasswordValid = hasMinLength && hasNumber;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isPasswordValid) {
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const passwordValue = formData.get("password") as string;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "client",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password: passwordValue,
            role: "client",
          }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Login successful");
        if (data.user) {
          useAuthStore.getState().setUser(data.user);
        }

        const isSetupComplete = await useAuthStore
          .getState()
          .checkClientSetupStatus();

        if (!isSetupComplete) {
          toast.error("Please set up your account first");
          router.replace("/profile/setup");
          return;
        }

        const redirect =
          new URLSearchParams(window.location.search).get("redirect") || "/";
        router.replace(redirect);
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-xl font-semibold flex justify-center items-center tracking-tight text-zinc-900"
          >
            <Image
              src={"/favicon.ico"}
              height="104"
              width="100"
              alt="MTWO Groups Logo"
            />
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Access your procurement dashboard and vendor connections.
          </p>
        </div>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-800"
                >
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs font-medium text-[#1d4ed8] hover:text-[#1e40af]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={7}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 pr-10 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
                <p className={hasNumber ? "text-emerald-600" : "text-zinc-500"}>
                  Contains at least 1 number
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isPasswordValid}
              className="h-11 w-full rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            New to MTWO Groups?{" "}
            <Link
              href="/register"
              className="font-medium text-[#1d4ed8] hover:text-[#1e40af]"
            >
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
