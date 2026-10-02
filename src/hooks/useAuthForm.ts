import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ZodError } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, LoginFormData } from "@/lib/auth-validation";
import { useRateLimit } from "@/hooks/useRateLimit";
import { getErrorMessage } from "@/lib/error-utils";

const REMEMBERED_EMAIL_KEY = "rememberedEmail";
const LOGIN_RATE_LIMIT_KEY = "loginAttempts";

export const useAuthForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginFormData, string>>
  >({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Rate limiting: 5 attempts per 15 minutes
  const rateLimit = useRateLimit(LOGIN_RATE_LIMIT_KEY, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    cooldownMs: 60 * 1000, // 1 minute cooldown
  });

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/admin");
      }
    };
    checkUser();
  }, [navigate]);

  const validateForm = (): boolean => {
    try {
      loginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      const formErrors: Partial<Record<keyof LoginFormData, string>> = {};

      if (error instanceof ZodError) {
        error.errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            formErrors[err.path[0] as keyof LoginFormData] = err.message;
          }
        });
      }

      setErrors(formErrors);
      return false;
    }
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check rate limit
    if (rateLimit.isLocked) {
      const remainingMsg =
        rateLimit.remainingMinutes > 0
          ? `Try again in ${rateLimit.remainingMinutes} minute${rateLimit.remainingMinutes !== 1 ? "s" : ""}`
          : "Please try again shortly";
      toast({
        title: "Too many login attempts",
        description: `For your security, further login attempts are temporarily disabled. ${remainingMsg}.`,
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      rateLimit.recordAttempt();
      toast({
        title: "Validation Error",
        description: "Please check your input and try again",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      // Record attempt after trying to login (whether success or failure)
      rateLimit.recordAttempt();

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }

        // Reset rate limit on successful login
        rateLimit.reset();

        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        navigate("/admin");
      }
    } catch (error: unknown) {
      rateLimit.recordAttempt();
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (targetEmail: string) => {
    const trimmedEmail = targetEmail.trim();

    if (!trimmedEmail) {
      toast({
        title: "Email required",
        description: "Enter your account email to receive a reset link.",
        variant: "destructive",
      });
      return;
    }

    const parsedEmail = loginSchema.shape.email.safeParse(trimmedEmail);
    if (!parsedEmail.success) {
      const message = parsedEmail.error.errors[0]?.message ?? "Invalid email address";
      toast({
        title: "Invalid email",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: "Reset link sent",
        description: "If an account exists for that email, a password reset link is on its way.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    loading,
    errors,
    handleLogin,
    // Password recovery
    handleForgotPassword,
    forgotPasswordLoading,
    resetEmailSent,
    setResetEmailSent,
    // Rate limiting info
    isRateLimited: rateLimit.isLocked,
    rateLimitRemaining: rateLimit.maxAttempts - rateLimit.attempts,
    rateLimitAttempts: rateLimit.attempts,
  };
};
