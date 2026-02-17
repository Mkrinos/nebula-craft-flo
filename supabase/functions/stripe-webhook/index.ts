import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit amounts for each package
const PACKAGE_CREDITS: Record<string, number> = {
  "starter_universe": 100,
  "stellar": 500,
  "cosmic": -1, // -1 means unlimited
  "galactic": -1, // -1 means unlimited with priority
};

const PACKAGE_NAMES: Record<string, string> = {
  "starter_universe": "Starter Universe",
  "stellar": "Stellar",
  "cosmic": "Cosmic",
  "galactic": "Galactic",
};

const PACKAGE_PRICES: Record<string, number> = {
  "starter_universe": 9,
  "stellar": 19,
  "cosmic": 39,
  "galactic": 79,
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

async function sendPurchaseConfirmationEmail(
  email: string,
  packageId: string,
  credits: number
) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    logStep("RESEND_API_KEY not configured, skipping email");
    return;
  }

  const resend = new Resend(resendKey);
  const packageName = PACKAGE_NAMES[packageId] || packageId;
  const price = PACKAGE_PRICES[packageId] || 0;
  const creditsText = credits === -1 ? "Unlimited" : `${credits}`;

  try {
    const { error } = await resend.emails.send({
      from: "MX2K Nexus <onboarding@resend.dev>",
      to: [email],
      subject: `🚀 Welcome to ${packageName} - Your Purchase is Complete!`,
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
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; border: 1px solid #00f5ff33; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #00f5ff22;">
                      <h1 style="margin: 0; color: #00f5ff; font-size: 28px; font-weight: bold;">🌌 MX2K NEXUS</h1>
                      <p style="margin: 10px 0 0; color: #888; font-size: 14px;">Purchase Confirmation</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px;">Welcome to ${packageName}! 🎉</h2>
                      
                      <p style="margin: 0 0 30px; color: #ccc; font-size: 16px; line-height: 1.6;">
                        Thank you for your purchase! Your account has been upgraded and you're ready to explore the universe.
                      </p>
                      
                      <!-- Order Summary -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff08; border-radius: 12px; border: 1px solid #00f5ff22; margin-bottom: 30px;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="margin: 0 0 15px; color: #00f5ff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Order Summary</h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 14px;">Plan</td>
                                <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${packageName}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 14px;">Credits</td>
                                <td style="padding: 8px 0; color: #00f5ff; font-size: 14px; text-align: right;">${creditsText}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 14px; border-top: 1px solid #ffffff11;">Total</td>
                                <td style="padding: 8px 0; color: #fff; font-size: 18px; font-weight: bold; text-align: right; border-top: 1px solid #ffffff11;">$${price}.00</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="https://powssiykpmcmkixurodu.lovableproject.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #00f5ff 0%, #0088ff 100%); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                              Start Creating →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background: #ffffff05; border-top: 1px solid #00f5ff11; text-align: center;">
                      <p style="margin: 0; color: #666; font-size: 12px;">
                        Questions? Reply to this email or visit our help center.
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
      logStep("Error sending purchase email", { error });
    } else {
      logStep("Purchase confirmation email sent", { email, packageId });
    }
  } catch (err: any) {
    logStep("Failed to send purchase email", { error: err.message });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: any) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Event verified", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout session", { sessionId: session.id });

      const packageId = session.metadata?.package_id;
      const userId = session.metadata?.user_id;
      const customerEmail = session.customer_email || session.customer_details?.email;

      if (!packageId || !userId) {
        logStep("Missing metadata", { packageId, userId });
        return new Response(JSON.stringify({ error: "Missing metadata" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const creditsToAdd = PACKAGE_CREDITS[packageId];
      logStep("Credits to add", { packageId, creditsToAdd });

      // Initialize Supabase client with service role
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      // Check if user has existing credits record
      const { data: existingCredits, error: fetchError } = await supabaseClient
        .from("user_credits")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) {
        logStep("Error fetching user credits", { error: fetchError.message });
        throw fetchError;
      }

      if (existingCredits) {
        // Update existing record
        const updateData: Record<string, any> = {
          subscription_tier: packageId,
          updated_at: new Date().toISOString(),
        };

        // For unlimited packages, set limit to null
        if (creditsToAdd === -1) {
          updateData.monthly_credit_limit = null;
        } else {
          // Add credits to the limit (or reset if upgrading)
          updateData.monthly_credit_limit = creditsToAdd;
          updateData.credits_spent = 0; // Reset spent credits on purchase
        }

        // Set features based on tier
        if (packageId === "cosmic" || packageId === "galactic") {
          updateData.has_hd_quality = true;
          updateData.has_voice_access = true;
        } else if (packageId === "stellar") {
          updateData.has_hd_quality = true;
          updateData.has_voice_access = false;
        }

        const { error: updateError } = await supabaseClient
          .from("user_credits")
          .update(updateData)
          .eq("user_id", userId);

        if (updateError) {
          logStep("Error updating user credits", { error: updateError.message });
          throw updateError;
        }

        logStep("User credits updated successfully", { userId, packageId });
      } else {
        // Create new record
        const insertData: Record<string, any> = {
          user_id: userId,
          subscription_tier: packageId,
          credits_spent: 0,
          credits_earned: 0,
          monthly_credit_limit: creditsToAdd === -1 ? null : creditsToAdd,
          has_hd_quality: packageId === "stellar" || packageId === "cosmic" || packageId === "galactic",
          has_voice_access: packageId === "cosmic" || packageId === "galactic",
        };

        const { error: insertError } = await supabaseClient
          .from("user_credits")
          .insert(insertData);

        if (insertError) {
          logStep("Error inserting user credits", { error: insertError.message });
          throw insertError;
        }

        logStep("User credits created successfully", { userId, packageId });
      }

      // Send purchase confirmation email
      if (customerEmail) {
        await sendPurchaseConfirmationEmail(customerEmail, packageId, creditsToAdd);
      } else {
        // Try to get email from auth.users via admin API
        const { data: userData } = await supabaseClient.auth.admin.getUserById(userId);
        
        if (userData?.user?.email) {
          await sendPurchaseConfirmationEmail(userData.user.email, packageId, creditsToAdd);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
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
