import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SIGNED_URL_EXPIRY = 3600; // 1 hour

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token for auth validation
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { paths, bucket = "generated-images" } = await req.json();

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return new Response(
        JSON.stringify({ error: "paths array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit batch size to prevent abuse
    if (paths.length > 50) {
      return new Response(
        JSON.stringify({ error: "Maximum 50 paths per request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for signed URL generation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Generate signed URLs for all paths
    const signedUrls: Record<string, string> = {};
    const errors: Record<string, string> = {};

    for (const path of paths) {
      // Validate path format
      if (typeof path !== 'string' || path.length === 0) {
        errors[path] = "Invalid path";
        continue;
      }

      // Extract file path from full URL if needed
      let filePath = path;
      if (path.includes('/storage/v1/object/public/')) {
        const match = path.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
        if (match) {
          filePath = match[1];
        }
      } else if (path.includes(`${bucket}/`)) {
        const match = path.match(new RegExp(`${bucket}/(.+)$`));
        if (match) {
          filePath = match[1];
        }
      }

      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

      if (error) {
        errors[path] = error.message;
      } else if (data?.signedUrl) {
        signedUrls[path] = data.signedUrl;
      }
    }

    return new Response(
      JSON.stringify({ 
        signedUrls,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        expiresIn: SIGNED_URL_EXPIRY
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating signed URLs:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate signed URLs";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
