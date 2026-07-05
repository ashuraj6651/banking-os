"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Mail, Lock, User, Sparkles, Shield, Cloud, Eye, EyeOff } from "lucide-react";
import { useBankOS } from "@/lib/store";
import { useLogin, useRegister, useAuth } from "@/lib/hooks";
import { Wordmark, Eyebrow } from "./Primitives";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Auth() {
  const { exitToLanding, startOnboarding } = useBankOS();
  const login = useLogin();
  const register = useRegister();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (mode === "register") {
        if (!name.trim()) {
          toast.error("Please enter your name");
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }
        await register.mutateAsync({ email: email.trim(), password, name: name.trim() });
        toast.success("Account created. Welcome to BankOS.");
      } else {
        await login.mutateAsync({ email: email.trim(), password });
        toast.success("Welcome back.");
      }
      // Full reload to re-evaluate auth state and clear any cached data.
      // This is the most reliable way to route to the correct stage after auth.
      setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      // jfetch now surfaces the server's actual error message
      const msg = err instanceof Error ? err.message : "Something went wrong";
      const status = (err as Error & { status?: number }).status;

      if (status === 409) {
        toast.error("An account with this email already exists. Please sign in instead.");
        setMode("login");
      } else if (status === 401) {
        toast.error("Invalid email or password. Please try again.");
      } else if (status === 400) {
        toast.error(msg || "Please check your details and try again.");
      } else {
        toast.error(msg || "Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <button
        onClick={exitToLanding}
        className="absolute left-5 top-5 text-sm text-white/40 transition-colors hover:text-white"
      >
        ← Back to landing
      </button>

      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Wordmark size="lg" />
        </div>

        <div className="glass-card rounded-3xl p-7 sm:p-9">
          {/* mode toggle */}
          <div className="mb-7 flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            <button
              onClick={() => setMode("login")}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
                mode === "login" ? "bg-gradient-to-b from-violet-500 to-electric-600 text-white shadow-[0_4px_16px_-4px_rgba(139,92,246,0.5)]" : "text-white/50 hover:text-white"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
                mode === "register" ? "bg-gradient-to-b from-violet-500 to-electric-600 text-white shadow-[0_4px_16px_-4px_rgba(139,92,246,0.5)]" : "text-white/50 hover:text-white"
              )}
            >
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              <Eyebrow>
                <Sparkles className="h-3 w-3" /> {mode === "login" ? "Welcome back" : "Join BankOS"}
              </Eyebrow>
              <h2 className="mt-4 text-2xl font-bold text-white">
                {mode === "login" ? "Sign in to your account" : "Create your account"}
              </h2>
              <p className="mt-1.5 text-sm text-white/50">
                {mode === "login"
                  ? "Your progress, missions and analytics are tied to your account."
                  : "Your data is private to you, isolated and backup-ready."}
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                {mode === "register" && (
                  <Field icon={User} label="Name">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-transparent text-white placeholder:text-white/30 focus:outline-none"
                    />
                  </Field>
                )}
                <Field icon={Mail} label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-transparent text-white placeholder:text-white/30 focus:outline-none"
                  />
                </Field>
                <Field icon={Lock} label="Password">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "At least 6 characters" : "••••••••"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="w-full bg-transparent text-white placeholder:text-white/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="shrink-0 text-white/30 transition-colors hover:text-white/60"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </Field>

                <button
                  type="submit"
                  disabled={login.isPending || register.isPending}
                  className="shine inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(139,92,246,0.6)] disabled:opacity-60"
                >
                  {(login.isPending || register.isPending) ? (
                    "Please wait…"
                  ) : (
                    <>
                      {mode === "login" ? "Sign In" : "Create Account"} <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-white/30">
                {mode === "login" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button onClick={() => setMode("register")} className="text-violet-300 hover:text-violet-200">
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button onClick={() => setMode("login")} className="text-violet-300 hover:text-violet-200">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* trust signals */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <Trust icon={Shield} label="Hashed passwords" />
          <Trust icon={Cloud} label="Backup ready" />
          <Trust icon={User} label="Private to you" />
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">{label}</label>
      <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3 focus-within:border-violet-400/40">
        <Icon className="h-4 w-4 shrink-0 text-white/40" />
        {children}
      </div>
    </div>
  );
}

function Trust({ icon: Icon, label }: { icon: typeof Shield; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <Icon className="h-4 w-4 text-violet-300" />
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
}
