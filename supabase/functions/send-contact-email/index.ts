import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getClientId, hitRateLimit } from "../_shared/rateLimit.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CONTACT_EMAIL = Deno.env.get("CONTACT_EMAIL");
const CONTACT_FROM = Deno.env.get("CONTACT_FROM") ?? "Portfolio Contact <onboarding@resend.dev>";

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const RATE_LIMIT_WINDOW_SECONDS = 60 * 60; // 1 hour
const MAX_SUBMISSIONS_PER_HOUR = 5;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client identifier for rate limiting
    const clientId = getClientId(req);

    // Check rate limit
    if (!(await hitRateLimit("contact", clientId, MAX_SUBMISSIONS_PER_HOUR, RATE_LIMIT_WINDOW_SECONDS))) {
      return new Response(
        JSON.stringify({
          error: "Too many submissions. Please try again later.",
          retryAfter: RATE_LIMIT_WINDOW_SECONDS,
        }),
        {
          status: 429, // Too Many Requests
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(RATE_LIMIT_WINDOW_SECONDS),
            ...corsHeaders,
          },
        }
      );
    }

    const { name, email, subject, message }: ContactEmailRequest =
      await req.json();

    // Validate input
    if (
      typeof name !== "string" || typeof email !== "string" ||
      typeof subject !== "string" || typeof message !== "string" ||
      !name.trim() || name.length > 100 || !EMAIL_RE.test(email) || email.length > 255 ||
      !subject.trim() || subject.length > 200 || !message.trim() || message.length > 5000
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Sending contact email notification:", { name, email, subject });

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    if (!CONTACT_EMAIL) {
      throw new Error("CONTACT_EMAIL is not configured");
    }

    // Send notification email to site owner using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: CONTACT_FROM,
        reply_to: email,
        to: [CONTACT_EMAIL],
        subject: `New Contact Form Submission: ${subject.replace(/[\r\n]/g, " ")}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Resend API error: ${errorData}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: "Could not send notification" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
