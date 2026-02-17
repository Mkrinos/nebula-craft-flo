import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SHA-1 hash function using Web Crypto API
async function sha1Hash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();

    if (!password || typeof password !== "string") {
      console.log("Invalid password input");
      return new Response(
        JSON.stringify({ error: "Password is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Minimum length check
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ 
          breached: false, 
          weak: true,
          message: "Password must be at least 8 characters" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash the password with SHA-1
    const hash = await sha1Hash(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    console.log(`Checking password hash prefix: ${prefix}...`);

    // Query HaveIBeenPwned API using k-Anonymity (only sends first 5 chars of hash)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "User-Agent": "NexusTouch-Security-Check",
      },
    });

    if (!response.ok) {
      console.error("HIBP API error:", response.status);
      // If API fails, allow the password (fail open for availability)
      return new Response(
        JSON.stringify({ breached: false, apiError: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const text = await response.text();
    const hashes = text.split("\n");

    // Check if our hash suffix is in the returned list
    let breachCount = 0;
    for (const line of hashes) {
      const [hashSuffix, count] = line.split(":");
      if (hashSuffix.trim() === suffix) {
        breachCount = parseInt(count.trim(), 10);
        break;
      }
    }

    const isBreached = breachCount > 0;
    console.log(`Password breach check: ${isBreached ? `BREACHED (${breachCount} times)` : "SAFE"}`);

    return new Response(
      JSON.stringify({
        breached: isBreached,
        count: breachCount,
        message: isBreached
          ? `This password has been exposed in ${breachCount.toLocaleString()} data breaches. Please choose a different password.`
          : "Password has not been found in known data breaches.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking breached password:", error);
    return new Response(
      JSON.stringify({ error: "Failed to check password", breached: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
