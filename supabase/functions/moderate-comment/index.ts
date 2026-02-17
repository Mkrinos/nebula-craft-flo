import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Input validation constants
const MAX_COMMENT_LENGTH = 500;
const MIN_COMMENT_LENGTH = 1;

function validateComment(comment: unknown): string {
  if (!comment || typeof comment !== 'string') {
    throw new Error('Comment text is required');
  }
  const trimmed = comment.trim();
  if (trimmed.length < MIN_COMMENT_LENGTH) {
    throw new Error('Comment cannot be empty');
  }
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Comment is too long. Maximum ${MAX_COMMENT_LENGTH} characters allowed.`);
  }
  return trimmed;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - require logged in user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Moderation request from user:', user.id);

    const body = await req.json();
    
    // Validate comment with length limits
    let validatedComment: string;
    try {
      validatedComment = validateComment(body.comment);
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('AI service not configured');
      // If no API key, allow comment with a warning flag
      return new Response(
        JSON.stringify({ 
          isAppropriate: true, 
          confidence: 0.5,
          reason: 'Moderation unavailable',
          moderatedComment: validatedComment
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Moderating comment:', validatedComment.substring(0, 50) + '...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are a content moderator for a family-friendly creative art platform used by children ages 6-12 and their parents. 

Your job is to analyze comments and determine if they are appropriate for this audience.

REJECT comments that contain:
- Profanity or vulgar language (even mild)
- Bullying, insults, or mean-spirited content
- Personal information requests (addresses, phone numbers, etc.)
- Scary or violent content
- Adult themes or inappropriate suggestions
- Spam or advertising
- Negative or discouraging messages about someone's art

ALLOW comments that are:
- Positive, encouraging, and supportive
- Constructive feedback given kindly
- Questions about art techniques
- Expressions of creativity and imagination
- Friendly conversation

If a comment is borderline, suggest a friendlier version.`
          },
          { 
            role: "user", 
            content: `Analyze this comment for a children's art platform. Respond with JSON only:

Comment: "${validatedComment}"

Return ONLY valid JSON in this exact format:
{
  "isAppropriate": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation",
  "moderatedComment": "original or friendlier version if needed"
}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service unavailable' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Fallback: allow but flag for manual review
      return new Response(
        JSON.stringify({ 
          isAppropriate: true, 
          confidence: 0.5,
          reason: 'Moderation service error - allowing with review flag',
          moderatedComment: validatedComment,
          needsReview: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response:', content);

    // Parse the JSON response from AI
    let moderationResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        moderationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Default to safe behavior - allow but flag
      moderationResult = {
        isAppropriate: true,
        confidence: 0.5,
        reason: 'Could not parse moderation response',
        moderatedComment: validatedComment,
        needsReview: true
      };
    }

    return new Response(
      JSON.stringify(moderationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in moderate-comment function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isAppropriate: true,
        confidence: 0.5,
        reason: 'Error during moderation',
        moderatedComment: ''
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
