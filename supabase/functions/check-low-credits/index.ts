import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOW_CREDIT_THRESHOLD = 0.2; // 20% remaining

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-LOW-CREDITS] ${step}${detailsStr}`);
};

async function sendLowCreditsEmail(
  email: string,
  creditsRemaining: number,
  creditLimit: number,
  tier: string
) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    logStep("RESEND_API_KEY not configured, skipping email");
    return;
  }

  const resend = new Resend(resendKey);
  const percentRemaining = Math.round((creditsRemaining / creditLimit) * 100);

  try {
    const { error } = await resend.emails.send({
      from: "MX2K Nexus <onboarding@resend.dev>",
      to: [email],
      subject: `⚠️ Credits Running Low - ${creditsRemaining} credits remaining`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; border: 1px solid #ff990033; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #ff990022;">
                      <h1 style="margin: 0; color: #00f5ff; font-size: 28px; font-weight: bold;">🌌 MX2K NEXUS</h1>
                      <p style="margin: 10px 0 0; color: #ff9900; font-size: 14px;">⚠️ Low Credits Alert</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px;">Your credits are running low!</h2>
                      
                      <p style="margin: 0 0 30px; color: #ccc; font-size: 16px; line-height: 1.6;">
                        You have <strong style="color: #ff9900;">${creditsRemaining}</strong> credits remaining out of ${creditLimit} (${percentRemaining}% left). 
                        Top up now to keep creating without interruption!
                      </p>
                      
                      <!-- Credits Meter -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff08; border-radius: 12px; border: 1px solid #ff990022; margin-bottom: 30px;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="margin: 0 0 15px; color: #ff9900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Credits Status</h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 14px;">Current Plan</td>
                                <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; text-transform: capitalize;">${tier.replace('_', ' ')}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 14px;">Credits Used</td>
                                <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${creditLimit - creditsRemaining}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 14px;">Credits Remaining</td>
                                <td style="padding: 8px 0; color: #ff9900; font-size: 18px; font-weight: bold; text-align: right;">${creditsRemaining}</td>
                              </tr>
                            </table>
                            <!-- Progress bar -->
                            <div style="margin-top: 15px; background: #ffffff11; border-radius: 8px; height: 8px; overflow: hidden;">
                              <div style="background: linear-gradient(90deg, #ff4444, #ff9900); width: ${percentRemaining}%; height: 100%; border-radius: 8px;"></div>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="https://powssiykpmcmkixurodu.lovableproject.com/billing" style="display: inline-block; background: linear-gradient(135deg, #ff9900 0%, #ff6600 100%); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                              Upgrade Now →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background: #ffffff05; border-top: 1px solid #ff990011; text-align: center;">
                      <p style="margin: 0; color: #666; font-size: 12px;">
                        Need unlimited credits? Check out our Cosmic or Galactic plans!
                      </p>
                      <p style="margin: 10px 0 0; color: #444; font-size: 11px;">
                        © 2024 MX2K Nexus. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      logStep("Error sending low credits email", { error });
    } else {
      logStep("Low credits email sent", { email, creditsRemaining });
    }
  } catch (err: any) {
    logStep("Failed to send low credits email", { error: err.message });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    // Get user credits
    const { data: credits, error: creditsError } = await supabaseClient
      .from("user_credits")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (creditsError) {
      throw creditsError;
    }

    if (!credits) {
      return new Response(JSON.stringify({ 
        checked: true, 
        notification_sent: false,
        reason: "No credits record found" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip if unlimited credits
    if (credits.monthly_credit_limit === null) {
      return new Response(JSON.stringify({ 
        checked: true, 
        notification_sent: false,
        reason: "User has unlimited credits" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const remaining = credits.monthly_credit_limit - credits.credits_spent;
    const percentRemaining = remaining / credits.monthly_credit_limit;

    logStep("Checking credits", { 
      userId, 
      remaining, 
      limit: credits.monthly_credit_limit,
      percentRemaining 
    });

    // Check if below threshold
    if (percentRemaining <= LOW_CREDIT_THRESHOLD && remaining > 0 && userEmail) {
      await sendLowCreditsEmail(
        userEmail,
        remaining,
        credits.monthly_credit_limit,
        credits.subscription_tier
      );

      return new Response(JSON.stringify({ 
        checked: true, 
        notification_sent: true,
        credits_remaining: remaining,
        percent_remaining: Math.round(percentRemaining * 100)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      checked: true, 
      notification_sent: false,
      credits_remaining: remaining,
      percent_remaining: Math.round(percentRemaining * 100),
      reason: percentRemaining > LOW_CREDIT_THRESHOLD ? "Credits above threshold" : "Credits at zero"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
