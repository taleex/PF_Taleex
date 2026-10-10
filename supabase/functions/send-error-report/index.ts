import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getClientId, hitRateLimit } from "../_shared/rateLimit.ts";

const esc = (v: unknown) =>
  String(v ?? "").slice(0, 5000).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ALERT_EMAIL = Deno.env.get("ALERT_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ErrorReportRequest {
  message: string;
  stack?: string;
  code?: string;
  timestamp?: string;
  url?: string;
  meta?: Record<string, unknown>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!RESEND_API_KEY || !ALERT_EMAIL) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY or ALERT_EMAIL is not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }

  try {
    // Max 3 alerts per client per 10 min, and 20 overall per hour
    const allowed = (await hitRateLimit("error-report", getClientId(req), 3, 600)) &&
      (await hitRateLimit("error-report", "global", 20, 3600));
    if (!allowed) {
      return new Response(JSON.stringify({ status: "throttled" }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const payload: ErrorReportRequest = await req.json();
    const {
      message,
      stack,
      code,
      timestamp = new Date().toISOString(),
      url,
      meta,
    } = payload;

    if (typeof message !== "string" || !message) {
      throw new Error("Missing error message");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LP Taleex Monitor <onboarding@resend.dev>",
        to: [ALERT_EMAIL],
        subject: "[LP Taleex] Supabase outage detected",
        html: `
          <h2>Supabase failed to deliver data</h2>
          <p><strong>Message:</strong> ${esc(message)}</p>
          ${code ? `<p><strong>Code:</strong> ${esc(code)}</p>` : ""}
          <p><strong>Timestamp:</strong> ${esc(timestamp)}</p>
          ${url ? `<p><strong>URL:</strong> ${esc(url)}</p>` : ""}
          ${
            stack
              ? `<h3>Stack trace</h3><pre>${esc(stack)}</pre>`
              : "<p><em>No stack trace provided</em></p>"
          }
          ${
            meta
              ? `<h3>Additional context</h3><pre>${esc(JSON.stringify(meta, null, 2))}</pre>`
              : ""
          }
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Resend API error: ${errorData}`);
    }

    const emailData = await emailResponse.json();
    console.log("Outage email sent successfully:", emailData);

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Failed to send outage email:", error);
    return new Response(
      JSON.stringify({ error: "Could not send report" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

serve(handler);
