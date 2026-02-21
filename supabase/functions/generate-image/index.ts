import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOW_CREDIT_THRESHOLD = 0.2; // 20% remaining

async function checkAndNotifyLowCredits(
  supabase: any,
  userId: string,
  userEmail: string | null,
  creditResult: { remaining: number; tier: string }
) {
  // Skip if unlimited credits (remaining is -1) or no email
  if (creditResult.remaining === -1 || !userEmail) return;

  // Get the credit limit to calculate percentage
  const { data: credits } = await supabase
    .from("user_credits")
    .select("monthly_credit_limit")
    .eq("user_id", userId)
    .maybeSingle();

  if (!credits?.monthly_credit_limit) return;

  const percentRemaining = creditResult.remaining / credits.monthly_credit_limit;

  // Only notify at specific thresholds to avoid spam
  const thresholds = [0.2, 0.1, 0.05]; // 20%, 10%, 5%
  const isAtThreshold = thresholds.some(t => 
    percentRemaining <= t && 
    percentRemaining > t - 0.05 &&
    creditResult.remaining > 0
  );

  if (!isAtThreshold) return;

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return;

  const resend = new Resend(resendKey);
  const percentDisplay = Math.round(percentRemaining * 100);

  try {
    await resend.emails.send({
      from: "MX2K Nexus <onboarding@resend.dev>",
      to: [userEmail],
      subject: `⚠️ Credits Running Low - ${creditResult.remaining} remaining`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; border: 1px solid #ff990033;">
                  <tr>
                    <td style="padding: 40px; text-align: center;">
                      <h1 style="color: #00f5ff; font-size: 24px; margin: 0 0 20px;">🌌 MX2K NEXUS</h1>
                      <h2 style="color: #ff9900; font-size: 20px; margin: 0 0 20px;">⚠️ Low Credits Alert</h2>
                      <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
                        You have <strong style="color: #ff9900;">${creditResult.remaining}</strong> credits remaining (${percentDisplay}%).
                      </p>
                      <div style="background: #ffffff11; border-radius: 8px; height: 8px; margin: 20px 0; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #ff4444, #ff9900); width: ${percentDisplay}%; height: 100%;"></div>
                      </div>
                      <a href="https://powssiykpmcmkixurodu.lovableproject.com/billing" style="display: inline-block; background: linear-gradient(135deg, #ff9900, #ff6600); color: #000; padding: 14px 32px; border-radius: 8px; font-weight: bold; text-decoration: none; margin-top: 20px;">
                        Upgrade Now →
                      </a>
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
    console.log("Low credits notification sent to", userEmail);
  } catch (err) {
    console.error("Failed to send low credits email:", err);
  }
}

// Input validation constants
const MAX_PROMPT_LENGTH = 500;
const MIN_PROMPT_LENGTH = 3;
const ALLOWED_STYLES = ['anime', 'cartoon', 'realistic', 'watercolor', 'pixel-art', 'fantasy', 'sci-fi', 'abstract', 'minimalist', null, undefined, ''];

function validatePrompt(prompt: unknown): string {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be text');
  }
  const trimmed = prompt.trim();
  if (trimmed.length < MIN_PROMPT_LENGTH) {
    throw new Error('Prompt is too short. Please provide more detail.');
  }
  if (trimmed.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt is too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.`);
  }
  return trimmed;
}

function validateStyle(style: unknown): string | null {
  if (style === null || style === undefined || style === '') {
    return null;
  }
  if (typeof style !== 'string') {
    return null;
  }
  const normalized = style.trim().toLowerCase();
  if (normalized && !ALLOWED_STYLES.includes(normalized)) {
    console.warn('Unknown style provided:', normalized);
    // Allow custom styles but log them for monitoring
  }
  return normalized || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate inputs
    let validatedPrompt: string;
    let validatedStyle: string | null;
    
    try {
      validatedPrompt = validatePrompt(body.prompt);
      validatedStyle = validateStyle(body.style);
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { saveToGallery, useCache = true } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("AI service not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Service role client for admin operations (storage, etc.)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userClient: ReturnType<typeof createClient> | null = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      
      // Create a user-authenticated client for RPC calls that check auth.uid()
      userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });
      
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (!authError && user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    }

    // Check cache first if user is authenticated and caching is enabled
    if (userId && useCache) {
      const normalizedPrompt = validatedPrompt.toLowerCase();
      const normalizedStyle = validatedStyle?.toLowerCase() || null;
      
      console.log("Checking cache for prompt:", normalizedPrompt, "style:", normalizedStyle);
      
      const { data: cachedImage, error: cacheError } = await supabaseAdmin
        .from("generated_images")
        .select("image_url, prompt, style")
        .eq("user_id", userId)
        .ilike("prompt", normalizedPrompt)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (!cacheError && cachedImage && cachedImage.length > 0) {
        // Find exact match considering style
        const exactMatch = cachedImage.find((img: { style?: string | null }) => {
          const imgStyle = img.style?.toLowerCase() || null;
          return imgStyle === normalizedStyle;
        });
        
        if (exactMatch) {
          console.log("Cache hit! Returning cached image");
          return new Response(
            JSON.stringify({ 
              image: exactMatch.image_url,
              description: "Image retrieved from cache",
              saved: true,
              cached: true
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
      console.log("Cache miss, generating new image");
    }

    // Check and deduct credits if user is authenticated
    if (userId && userClient) {
      console.log("Checking credits for user:", userId);
      
      // Use user-authenticated client for RPC that checks auth.uid()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: creditError } = await (userClient as any).rpc('check_and_deduct_credit', {
        p_user_id: userId,
        p_amount: 1
      });
      
      // Cast the result to the expected type
      const creditResult = data as { allowed?: boolean; remaining?: number; tier?: string; error?: string } | null;

      console.log("Credit check result:", JSON.stringify(creditResult), "Error:", creditError);

      if (creditError) {
        console.error("Credit check RPC error:", creditError);
        return new Response(
          JSON.stringify({ error: "Failed to verify credits. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Handle RPC error response (when function returns error object)
      if (creditResult?.error) {
        console.error("Credit check returned error:", creditResult.error);
        return new Response(
          JSON.stringify({ 
            error: creditResult.error,
            remaining: creditResult.remaining || 0,
            tier: creditResult.tier || 'unknown'
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Handle insufficient credits
      if (creditResult && creditResult.allowed === false) {
        return new Response(
          JSON.stringify({ 
            error: "You've used all your credits for this month. Upgrade your plan for more!",
            remaining: creditResult.remaining,
            tier: creditResult.tier
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Credit deducted successfully. Remaining:", creditResult?.remaining, "Tier:", creditResult?.tier);

      // Check for low credits and send notification if needed (non-blocking)
      if (creditResult && userEmail && creditResult.remaining !== undefined && creditResult.tier) {
        checkAndNotifyLowCredits(supabaseAdmin, userId, userEmail, { 
          remaining: creditResult.remaining, 
          tier: creditResult.tier 
        }).catch(err => console.error("Low credits check failed:", err));
      }
    } else if (saveToGallery) {
      return new Response(
        JSON.stringify({ error: "Authentication required to save images" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enhance prompt with style if provided
    const enhancedPrompt = validatedStyle 
      ? `${validatedPrompt}. Style: ${validatedStyle}. High quality, detailed, visually stunning.`
      : `${validatedPrompt}. High quality, detailed, visually stunning.`;

    console.log("Generating image with prompt:", enhancedPrompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: enhancedPrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Please add credits to continue generating images." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract image from response
    const message = data.choices?.[0]?.message;
    const imageData = message?.images?.[0]?.image_url?.url;
    const textContent = message?.content;

    if (!imageData) {
      // Check if the model provided a reason for not generating
      const reason = textContent || "The image could not be generated. Try a different prompt.";
      console.log("No image generated. Model response:", reason);
      return new Response(
        JSON.stringify({ error: reason }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let savedImageUrl = imageData;

    // Save to storage and database if user is authenticated and requested
    if (saveToGallery && userId) {
      try {
        // Extract base64 data and convert to blob
        const base64Data = imageData.split(",")[1];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Upload to storage
        const fileName = `${userId}/${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from("generated-images")
          .upload(fileName, binaryData, {
            contentType: "image/png",
            upsert: false
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
        } else {
          // Get public URL
          const { data: publicUrlData } = supabaseAdmin.storage
            .from("generated-images")
            .getPublicUrl(fileName);
          
          savedImageUrl = publicUrlData.publicUrl;

          // Save to database with normalized prompt for better cache matching
          const { error: dbError } = await supabaseAdmin
            .from("generated_images")
            .insert({
              user_id: userId,
              prompt: validatedPrompt.toLowerCase(),
              style: validatedStyle?.toLowerCase() || null,
              image_url: savedImageUrl
            });

          if (dbError) {
            console.error("Database insert error:", dbError);
          }
        }
      } catch (saveError) {
        console.error("Error saving to gallery:", saveError);
        // Continue with response even if save fails
      }
    }

    return new Response(
      JSON.stringify({ 
        image: savedImageUrl,
        description: textContent || "Image generated successfully",
        saved: saveToGallery && userId ? true : false,
        cached: false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating image:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
