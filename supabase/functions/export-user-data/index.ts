import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with user's token to get their ID
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to access all user data
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const userId = user.id;

    console.log(`Exporting data for user: ${userId}`);

    // Collect all user data from various tables
    const [
      profile,
      generatedImages,
      favoritePrompts,
      achievements,
      credits,
      levels,
      streaks,
      quests,
      unlockedPersonas,
      unlockedThemes,
      studios,
      decorations,
      studioPlacements,
      playlists,
      dailyUsage,
      feedbackSubmissions,
      parentalControls,
      activityLog,
      imageLikes,
      imageComments,
      follows,
      friends,
      onboarding,
      dashboardLayouts,
      studioVisits,
      studioLikes,
      studioComments,
      eventParticipation,
      sharedPlaylists,
      platformFavorites,
      platformSuggestions,
      musicTracks
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
      supabaseAdmin.from('generated_images').select('*').eq('user_id', userId),
      supabaseAdmin.from('favorite_prompts').select('*').eq('user_id', userId),
      supabaseAdmin.from('user_achievements').select('*, achievements(*)').eq('user_id', userId),
      supabaseAdmin.from('user_credits').select('*').eq('user_id', userId).single(),
      supabaseAdmin.from('user_levels').select('*').eq('user_id', userId).single(),
      supabaseAdmin.from('user_streaks').select('*').eq('user_id', userId).single(),
      supabaseAdmin.from('user_quests').select('*, quests(*)').eq('user_id', userId),
      supabaseAdmin.from('user_unlocked_personas').select('*, personas(*)').eq('user_id', userId),
      supabaseAdmin.from('user_unlocked_themes').select('*').eq('user_id', userId),
      supabaseAdmin.from('user_studios').select('*, studio_spaces(*)').eq('user_id', userId),
      supabaseAdmin.from('user_decorations').select('*, studio_decorations(*)').eq('user_id', userId),
      supabaseAdmin.from('user_studio_placements').select('*').eq('user_id', userId),
      supabaseAdmin.from('playlists').select('*, playlist_tracks(*, music_tracks(*))').eq('user_id', userId),
      supabaseAdmin.from('daily_usage').select('*').eq('user_id', userId),
      supabaseAdmin.from('feedback_submissions').select('*').eq('user_id', userId),
      supabaseAdmin.from('parental_controls').select('*').or(`parent_user_id.eq.${userId},child_user_id.eq.${userId}`),
      supabaseAdmin.from('child_activity_log').select('*').eq('child_user_id', userId),
      supabaseAdmin.from('image_likes').select('*').eq('user_id', userId),
      supabaseAdmin.from('image_comments').select('*').eq('user_id', userId),
      supabaseAdmin.from('user_follows').select('*').or(`follower_id.eq.${userId},following_id.eq.${userId}`),
      supabaseAdmin.from('user_friends').select('*').or(`user_id.eq.${userId},friend_id.eq.${userId}`),
      supabaseAdmin.from('user_onboarding').select('*').eq('user_id', userId).single(),
      supabaseAdmin.from('user_dashboard_layouts').select('*').eq('user_id', userId).single(),
      supabaseAdmin.from('studio_visits').select('*').or(`visitor_id.eq.${userId},owner_id.eq.${userId}`),
      supabaseAdmin.from('studio_likes').select('*').eq('user_id', userId),
      supabaseAdmin.from('studio_comments').select('*').eq('user_id', userId),
      supabaseAdmin.from('user_event_participation').select('*, studio_events(*)').eq('user_id', userId),
      supabaseAdmin.from('shared_playlists').select('*').or(`shared_by.eq.${userId},shared_with.eq.${userId}`),
      supabaseAdmin.from('platform_favorites').select('*').eq('user_id', userId),
      supabaseAdmin.from('platform_suggestions').select('*').eq('user_id', userId),
      supabaseAdmin.from('music_tracks').select('*').eq('uploaded_by', userId)
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      userId: userId,
      email: user.email,
      profile: profile.data,
      generatedImages: generatedImages.data || [],
      favoritePrompts: favoritePrompts.data || [],
      achievements: achievements.data || [],
      credits: credits.data,
      levels: levels.data,
      streaks: streaks.data,
      quests: quests.data || [],
      unlockedPersonas: unlockedPersonas.data || [],
      unlockedThemes: unlockedThemes.data || [],
      studios: studios.data || [],
      decorations: decorations.data || [],
      studioPlacements: studioPlacements.data || [],
      playlists: playlists.data || [],
      dailyUsage: dailyUsage.data || [],
      feedbackSubmissions: feedbackSubmissions.data || [],
      parentalControls: parentalControls.data || [],
      activityLog: activityLog.data || [],
      imageLikes: imageLikes.data || [],
      imageComments: imageComments.data || [],
      follows: follows.data || [],
      friends: friends.data || [],
      onboarding: onboarding.data,
      dashboardLayouts: dashboardLayouts.data,
      studioVisits: studioVisits.data || [],
      studioLikes: studioLikes.data || [],
      studioComments: studioComments.data || [],
      eventParticipation: eventParticipation.data || [],
      sharedPlaylists: sharedPlaylists.data || [],
      platformFavorites: platformFavorites.data || [],
      platformSuggestions: platformSuggestions.data || [],
      uploadedMusicTracks: musicTracks.data || []
    };

    console.log(`Data export completed for user: ${userId}`);

    return new Response(
      JSON.stringify(exportData, null, 2),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="nexus-touch-data-export-${new Date().toISOString().split('T')[0]}.json"`
        } 
      }
    );
  } catch (error) {
    console.error('Error exporting user data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to export data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
