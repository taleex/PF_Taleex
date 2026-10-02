import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthForm } from "@/hooks/useAuthForm";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Code2,
  Database,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

const Field = ({ id, label, error, children }: FieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium text-[#0A0908]">
      {label}
    </Label>
    {children}
    {error && (
      <p
        id={`${id}-error`}
        role="alert"
        className="flex items-center gap-1.5 text-sm text-destructive"
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const FEATURES = [
  {
    icon: Layers,
    title: "Real-time content editing",
    description: "Update projects, experience and skills in minutes.",
  },
  {
    icon: Database,
    title: "Media & uploads",
    description: "Avatars, project images and CVs with instant preview.",
  },
  {
    icon: BarChart3,
    title: "Visitor insights",
    description: "Review feedback and contact messages in one place.",
  },
];

const Auth = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    loading,
    errors,
    handleLogin,
    handleForgotPassword,
    forgotPasswordLoading,
    resetEmailSent,
    setResetEmailSent,
    isRateLimited,
    rateLimitRemaining,
  } = useAuthForm();

  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [forgot, setForgot] = useState(false);

  const passwordDescribedBy =
    [errors.password ? "password-error" : null, capsLock ? "caps-lock-hint" : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="light flex min-h-screen bg-[#FFFFFA]">
      {/* ── Left brand panel (desktop) ─────────────────────────── */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#0A0908] p-12 lg:flex">
        <div className="pointer-events-none absolute -left-24 top-[15%] h-[420px] w-[420px] rounded-full bg-[#FF6542] opacity-20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-10 bottom-[10%] h-[460px] w-[460px] rounded-full bg-[#912F40] opacity-20 blur-[130px]" />

        <div className="animate-fade-in-up relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6542] to-[#912F40] text-white shadow-lg shadow-[#FF6542]/30">
            <Code2 className="h-5 w-5" />
          </div>
          <span className="text-3xl font-bold tracking-tight">
            <span className="text-[#FF6542]">Tal</span>
            <span className="text-[#FFFFFA]">eex</span>
          </span>
        </div>

        <div className="relative z-10 space-y-6">
          <div
            className="animate-fade-in-up inline-flex w-fit items-center gap-2 rounded-full border border-[#FF6542]/30 bg-[#FF6542]/10 px-4 py-1.5 text-sm font-medium text-[#FF6542]"
            style={{ animationDelay: "0.1s" }}
          >
            <Sparkles className="h-4 w-4" />
            Admin Dashboard
          </div>

          <h1
            className="animate-fade-in-up text-4xl font-bold leading-tight text-[#FFFFFA]"
            style={{ animationDelay: "0.15s" }}
          >
            Manage your portfolio,
            <br />
            <span className="text-gradient">anywhere.</span>
          </h1>

          <p
            className="animate-fade-in-up max-w-md text-base leading-relaxed text-[#748386]"
            style={{ animationDelay: "0.2s" }}
          >
            Sign in to update your projects, skills, experience and contact
            details — no code required.
          </p>

          <ul className="space-y-4 pt-2">
            {FEATURES.map((feature, index) => (
              <li
                key={feature.title}
                className="animate-fade-in-up flex items-start gap-3"
                style={{ animationDelay: `${0.25 + index * 0.08}s` }}
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF6542]/10 text-[#FF6542]">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#FFFFFA]">
                    {feature.title}
                  </p>
                  <p className="text-sm text-[#748386]">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p
          className="animate-fade-in-up relative z-10 text-sm text-[#748386]"
          style={{ animationDelay: "0.5s" }}
        >
          © {new Date().getFullYear()} Taleex · Built with React &amp; Supabase
        </p>
      </aside>

      {/* ── Right form panel ───────────────────────────────────── */}
      <main className="relative flex w-full flex-col items-center justify-center bg-[#FFFFFA] px-6 py-10 lg:w-1/2 lg:px-12">
        {/* Mobile brand mark (left panel is hidden on small screens) */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6542] to-[#912F40] text-white shadow-md">
            <Code2 className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#0A0908]">
            <span className="text-[#FF6542]">Tal</span>eex
          </span>
        </div>

        <Card
          className="animate-fade-in-up w-full max-w-md border-gray-200 bg-white shadow-xl shadow-gray-200/60"
          style={{ animationDelay: "0.1s" }}
        >
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight text-[#0A0908]">
              {forgot ? "Reset your password" : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {forgot
                ? "Enter your email and we'll send you a reset link."
                : "Enter your credentials to access the admin dashboard"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Rate-limit banner */}
            {isRateLimited && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Too many login attempts</p>
                  <p className="text-destructive/90">
                    For your security, further attempts are temporarily locked.
                  </p>
                </div>
              </div>
            )}

            {forgot && resetEmailSent ? (
              <div role="status" className="space-y-4">
                <div className="flex flex-col items-center gap-3 rounded-lg border border-green-600/20 bg-green-50 p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0A0908]">Link sent</p>
                    <p className="mt-1 text-sm text-gray-600">
                      If an account exists for{" "}
                      <span className="font-medium text-[#0A0908]">{email}</span>,
                      a password reset link is on its way.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 text-[#0A0908] hover:bg-gray-50"
                  onClick={() => {
                    setForgot(false);
                    setResetEmailSent(false);
                  }}
                >
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (forgot) {
                    void handleForgotPassword(email);
                  } else {
                    void handleLogin(e);
                  }
                }}
                className="space-y-4"
                noValidate
              >
                <Field id="email" label="Email" error={errors.email}>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading || forgotPasswordLoading}
                      className="h-11 border-gray-300 pl-10 text-base text-[#0A0908] transition-colors focus-visible:border-[#FF6542] focus-visible:ring-primary/20"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      autoFocus
                    />
                  </div>
                </Field>

                {!forgot && (
                  <Field id="password" label="Password" error={errors.password}>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyUp={(e) =>
                          setCapsLock(e.getModifierState?.("CapsLock") ?? false)
                        }
                        required
                        disabled={loading}
                        className="h-11 border-gray-300 pl-9 pr-10 text-base text-[#0A0908] transition-colors focus-visible:border-[#FF6542] focus-visible:ring-primary/20"
                        aria-invalid={!!errors.password}
                        aria-describedby={passwordDescribedBy}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition-colors hover:text-[#0A0908] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {capsLock && (
                      <p
                        id="caps-lock-hint"
                        className="flex items-center gap-1.5 text-sm text-amber-600"
                      >
                        Caps Lock is on
                      </p>
                    )}
                  </Field>
                )}

                {!forgot && (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        disabled={loading}
                        className="border-gray-300 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <Label htmlFor="remember" className="cursor-pointer text-sm text-gray-700">
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForgot(true);
                        setCapsLock(false);
                      }}
                      className="rounded text-sm font-medium text-[#FF6542] transition-colors hover:text-[#912F40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="group w-full bg-[#FF6542] text-white hover:bg-[#e05535]"
                  disabled={loading || forgotPasswordLoading}
                >
                  {loading || forgotPasswordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {forgot ? "Sending link..." : "Logging in..."}
                    </>
                  ) : forgot ? (
                    "Send reset link"
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>

                {isRateLimited && (
                  <p className="text-center text-sm text-gray-500">
                    {rateLimitRemaining > 0
                      ? `${rateLimitRemaining} attempt${rateLimitRemaining !== 1 ? "s" : ""} remaining`
                      : "Locked"}
                  </p>
                )}
              </form>
            )}
          </CardContent>
        </Card>
        <Link
          to="/"
          className="animate-fade-in-up mt-6 inline-flex items-center gap-1.5 rounded text-sm text-gray-500 transition-colors hover:text-[#FF6542] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          style={{ animationDelay: "0.2s" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to website
        </Link>

        <p
          className="animate-fade-in-up mt-3 flex items-center gap-1.5 text-xs text-gray-400"
          style={{ animationDelay: "0.25s" }}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Authorized personnel only · Access is recorded
        </p>
      </main>
    </div>
  );
};

export default Auth;