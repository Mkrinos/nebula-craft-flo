export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          credits_reward: number
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          sort_order: number
        }
        Insert: {
          category?: string
          created_at?: string
          credits_reward?: number
          description: string
          icon?: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          credits_reward?: number
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          sort_order?: number
        }
        Relationships: []
      }
      child_activity_log: {
        Row: {
          activity_details: Json | null
          activity_type: string
          child_user_id: string
          created_at: string
          id: string
        }
        Insert: {
          activity_details?: Json | null
          activity_type: string
          child_user_id: string
          created_at?: string
          id?: string
        }
        Update: {
          activity_details?: Json | null
          activity_type?: string
          child_user_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      contributor_badges: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          rarity: string
          requirement_type: string
          requirement_value: number
          sort_order: number
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon?: string
          id: string
          name: string
          rarity?: string
          requirement_type: string
          requirement_value?: number
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          rarity?: string
          requirement_type?: string
          requirement_value?: number
          sort_order?: number
        }
        Relationships: []
      }
      daily_usage: {
        Row: {
          generations_count: number | null
          id: string
          time_spent_minutes: number | null
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          generations_count?: number | null
          id?: string
          time_spent_minutes?: number | null
          updated_at?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          generations_count?: number | null
          id?: string
          time_spent_minutes?: number | null
          updated_at?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_prompts: {
        Row: {
          category: string | null
          created_at: string
          id: string
          language_code: string | null
          prompt_text: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          language_code?: string | null
          prompt_text: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          language_code?: string | null
          prompt_text?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_rollouts: {
        Row: {
          created_at: string
          dependencies: string[] | null
          feature_category: string
          feature_description: string
          feature_name: string
          id: string
          is_active: boolean | null
          is_released: boolean | null
          metadata: Json | null
          priority: number | null
          release_month: number
          release_year: number
          released_at: string | null
        }
        Insert: {
          created_at?: string
          dependencies?: string[] | null
          feature_category: string
          feature_description: string
          feature_name: string
          id?: string
          is_active?: boolean | null
          is_released?: boolean | null
          metadata?: Json | null
          priority?: number | null
          release_month: number
          release_year: number
          released_at?: string | null
        }
        Update: {
          created_at?: string
          dependencies?: string[] | null
          feature_category?: string
          feature_description?: string
          feature_name?: string
          id?: string
          is_active?: boolean | null
          is_released?: boolean | null
          metadata?: Json | null
          priority?: number | null
          release_month?: number
          release_year?: number
          released_at?: string | null
        }
        Relationships: []
      }
      feedback_submissions: {
        Row: {
          age_group: string | null
          child_age_group: string | null
          child_engagement: string[] | null
          concern_ratings: Json | null
          contact_email: string | null
          contact_frequency: string | null
          created_at: string
          device_type: string | null
          dream_feature: string | null
          expected_price: string | null
          experience_rating: number | null
          feature_priorities: string[] | null
          feature_ratings: Json | null
          feature_suggestions: string | null
          feedback_type: string
          first_impressions: string[] | null
          first_impressions_other: string | null
          heard_from: string | null
          id: string
          improvements: string[] | null
          improvements_other: string | null
          language: string | null
          loved_features: string[] | null
          loved_other: string | null
          other_platforms: string[] | null
          other_platforms_other: string | null
          overall_satisfaction: number | null
          participation_type: string | null
          platform_comparison: string | null
          primary_value: string[] | null
          primary_value_other: string | null
          questions_and_concerns: string | null
          recommend_likelihood: string | null
          safety_feature_ranking: string[] | null
          session_id: string
          signup_likelihood: string | null
          time_spent: string | null
          user_id: string | null
          would_return: string | null
        }
        Insert: {
          age_group?: string | null
          child_age_group?: string | null
          child_engagement?: string[] | null
          concern_ratings?: Json | null
          contact_email?: string | null
          contact_frequency?: string | null
          created_at?: string
          device_type?: string | null
          dream_feature?: string | null
          expected_price?: string | null
          experience_rating?: number | null
          feature_priorities?: string[] | null
          feature_ratings?: Json | null
          feature_suggestions?: string | null
          feedback_type: string
          first_impressions?: string[] | null
          first_impressions_other?: string | null
          heard_from?: string | null
          id?: string
          improvements?: string[] | null
          improvements_other?: string | null
          language?: string | null
          loved_features?: string[] | null
          loved_other?: string | null
          other_platforms?: string[] | null
          other_platforms_other?: string | null
          overall_satisfaction?: number | null
          participation_type?: string | null
          platform_comparison?: string | null
          primary_value?: string[] | null
          primary_value_other?: string | null
          questions_and_concerns?: string | null
          recommend_likelihood?: string | null
          safety_feature_ranking?: string[] | null
          session_id: string
          signup_likelihood?: string | null
          time_spent?: string | null
          user_id?: string | null
          would_return?: string | null
        }
        Update: {
          age_group?: string | null
          child_age_group?: string | null
          child_engagement?: string[] | null
          concern_ratings?: Json | null
          contact_email?: string | null
          contact_frequency?: string | null
          created_at?: string
          device_type?: string | null
          dream_feature?: string | null
          expected_price?: string | null
          experience_rating?: number | null
          feature_priorities?: string[] | null
          feature_ratings?: Json | null
          feature_suggestions?: string | null
          feedback_type?: string
          first_impressions?: string[] | null
          first_impressions_other?: string | null
          heard_from?: string | null
          id?: string
          improvements?: string[] | null
          improvements_other?: string | null
          language?: string | null
          loved_features?: string[] | null
          loved_other?: string | null
          other_platforms?: string[] | null
          other_platforms_other?: string | null
          overall_satisfaction?: number | null
          participation_type?: string | null
          platform_comparison?: string | null
          primary_value?: string[] | null
          primary_value_other?: string | null
          questions_and_concerns?: string | null
          recommend_likelihood?: string | null
          safety_feature_ranking?: string[] | null
          session_id?: string
          signup_likelihood?: string | null
          time_spent?: string | null
          user_id?: string | null
          would_return?: string | null
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_public: boolean
          prompt: string
          style: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_public?: boolean
          prompt: string
          style?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_public?: boolean
          prompt?: string
          style?: string | null
          user_id?: string
        }
        Relationships: []
      }
      image_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          image_id: string
          is_child_friendly: boolean
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_id: string
          is_child_friendly?: boolean
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_id?: string
          is_child_friendly?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_comments_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
        ]
      }
      image_likes: {
        Row: {
          created_at: string
          id: string
          image_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_likes_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
        ]
      }
      music_tracks: {
        Row: {
          artist: string | null
          category: string
          created_at: string
          duration_seconds: number | null
          file_path: string
          id: string
          is_default: boolean | null
          sort_order: number | null
          title: string
          uploaded_by: string | null
        }
        Insert: {
          artist?: string | null
          category?: string
          created_at?: string
          duration_seconds?: number | null
          file_path: string
          id?: string
          is_default?: boolean | null
          sort_order?: number | null
          title: string
          uploaded_by?: string | null
        }
        Update: {
          artist?: string | null
          category?: string
          created_at?: string
          duration_seconds?: number | null
          file_path?: string
          id?: string
          is_default?: boolean | null
          sort_order?: number | null
          title?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      parental_controls: {
        Row: {
          allow_comments: boolean | null
          allow_community_posting: boolean | null
          allow_community_viewing: boolean | null
          blocked_keywords: string[] | null
          child_user_id: string
          content_filter_level: string
          created_at: string
          daily_generation_limit: number | null
          daily_time_limit_minutes: number | null
          id: string
          parent_user_id: string
          updated_at: string
          verification_code: string | null
          verification_requested_at: string | null
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          allow_comments?: boolean | null
          allow_community_posting?: boolean | null
          allow_community_viewing?: boolean | null
          blocked_keywords?: string[] | null
          child_user_id: string
          content_filter_level?: string
          created_at?: string
          daily_generation_limit?: number | null
          daily_time_limit_minutes?: number | null
          id?: string
          parent_user_id: string
          updated_at?: string
          verification_code?: string | null
          verification_requested_at?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          allow_comments?: boolean | null
          allow_community_posting?: boolean | null
          allow_community_viewing?: boolean | null
          blocked_keywords?: string[] | null
          child_user_id?: string
          content_filter_level?: string
          created_at?: string
          daily_generation_limit?: number | null
          daily_time_limit_minutes?: number | null
          id?: string
          parent_user_id?: string
          updated_at?: string
          verification_code?: string | null
          verification_requested_at?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      personas: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits_to_unlock: number
          description: string
          id: string
          is_starter: boolean
          name: string
          sort_order: number
          style: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits_to_unlock?: number
          description: string
          id?: string
          is_starter?: boolean
          name: string
          sort_order?: number
          style: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits_to_unlock?: number
          description?: string
          id?: string
          is_starter?: boolean
          name?: string
          sort_order?: number
          style?: string
        }
        Relationships: []
      }
      platform_favorites: {
        Row: {
          created_at: string
          id: string
          platform_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform_id?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_suggestions: {
        Row: {
          age_range: string
          category: string
          created_at: string
          description: string
          id: string
          platform_name: string
          platform_url: string | null
          status: string
          user_id: string | null
          why_recommended: string | null
        }
        Insert: {
          age_range: string
          category: string
          created_at?: string
          description: string
          id?: string
          platform_name: string
          platform_url?: string | null
          status?: string
          user_id?: string | null
          why_recommended?: string | null
        }
        Update: {
          age_range?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          platform_name?: string
          platform_url?: string | null
          status?: string
          user_id?: string | null
          why_recommended?: string | null
        }
        Relationships: []
      }
      playlist_tracks: {
        Row: {
          added_at: string
          id: string
          playlist_id: string
          sort_order: number | null
          track_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          playlist_id: string
          sort_order?: number | null
          track_id: string
        }
        Update: {
          added_at?: string
          id?: string
          playlist_id?: string
          sort_order?: number | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          share_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          share_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          share_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          selected_persona_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          selected_persona_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          selected_persona_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_persona_id_fkey"
            columns: ["selected_persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          category: string
          created_at: string
          credits_reward: number
          description: string
          difficulty: number
          expires_at: string | null
          icon: string
          id: string
          is_active: boolean
          quest_type: string
          requirement_type: string
          requirement_value: number
          sort_order: number
          starts_at: string | null
          story_complete: string | null
          story_intro: string | null
          title: string
          unlock_content_id: string | null
          unlock_content_type: string | null
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          credits_reward?: number
          description: string
          difficulty?: number
          expires_at?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          quest_type?: string
          requirement_type: string
          requirement_value?: number
          sort_order?: number
          starts_at?: string | null
          story_complete?: string | null
          story_intro?: string | null
          title: string
          unlock_content_id?: string | null
          unlock_content_type?: string | null
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          credits_reward?: number
          description?: string
          difficulty?: number
          expires_at?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          quest_type?: string
          requirement_type?: string
          requirement_value?: number
          sort_order?: number
          starts_at?: string | null
          story_complete?: string | null
          story_intro?: string | null
          title?: string
          unlock_content_id?: string | null
          unlock_content_type?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
      shared_playlists: {
        Row: {
          can_edit: boolean
          created_at: string
          id: string
          playlist_id: string
          share_link: string | null
          shared_by: string
          shared_with: string
        }
        Insert: {
          can_edit?: boolean
          created_at?: string
          id?: string
          playlist_id: string
          share_link?: string | null
          shared_by: string
          shared_with: string
        }
        Update: {
          can_edit?: boolean
          created_at?: string
          id?: string
          playlist_id?: string
          share_link?: string | null
          shared_by?: string
          shared_with?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_playlists_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_child_friendly: boolean
          owner_id: string
          studio_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_child_friendly?: boolean
          owner_id: string
          studio_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_child_friendly?: boolean
          owner_id?: string
          studio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_comments_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studio_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_decorations: {
        Row: {
          category: string
          created_at: string
          credits_cost: number | null
          description: string
          icon: string
          id: string
          is_starter: boolean | null
          name: string
          rarity: string | null
          sort_order: number | null
          unlock_method: string
          unlock_requirement_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          credits_cost?: number | null
          description: string
          icon?: string
          id?: string
          is_starter?: boolean | null
          name: string
          rarity?: string | null
          sort_order?: number | null
          unlock_method?: string
          unlock_requirement_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          credits_cost?: number | null
          description?: string
          icon?: string
          id?: string
          is_starter?: boolean | null
          name?: string
          rarity?: string | null
          sort_order?: number | null
          unlock_method?: string
          unlock_requirement_id?: string | null
        }
        Relationships: []
      }
      studio_events: {
        Row: {
          bonus_credits: number | null
          bonus_xp: number | null
          created_at: string
          description: string
          ends_at: string
          exclusive_decoration_ids: string[] | null
          exclusive_studio_ids: string[] | null
          icon: string
          id: string
          is_active: boolean
          name: string
          starts_at: string
          theme: string
        }
        Insert: {
          bonus_credits?: number | null
          bonus_xp?: number | null
          created_at?: string
          description: string
          ends_at: string
          exclusive_decoration_ids?: string[] | null
          exclusive_studio_ids?: string[] | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          starts_at: string
          theme?: string
        }
        Update: {
          bonus_credits?: number | null
          bonus_xp?: number | null
          created_at?: string
          description?: string
          ends_at?: string
          exclusive_decoration_ids?: string[] | null
          exclusive_studio_ids?: string[] | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          starts_at?: string
          theme?: string
        }
        Relationships: []
      }
      studio_likes: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          studio_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          studio_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          studio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_likes_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studio_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_spaces: {
        Row: {
          background_style: string
          created_at: string
          credits_cost: number | null
          description: string
          id: string
          is_starter: boolean | null
          name: string
          sort_order: number | null
          theme: string
          unlock_method: string
          unlock_requirement_id: string | null
        }
        Insert: {
          background_style?: string
          created_at?: string
          credits_cost?: number | null
          description: string
          id?: string
          is_starter?: boolean | null
          name: string
          sort_order?: number | null
          theme?: string
          unlock_method?: string
          unlock_requirement_id?: string | null
        }
        Update: {
          background_style?: string
          created_at?: string
          credits_cost?: number | null
          description?: string
          id?: string
          is_starter?: boolean | null
          name?: string
          sort_order?: number | null
          theme?: string
          unlock_method?: string
          unlock_requirement_id?: string | null
        }
        Relationships: []
      }
      studio_visits: {
        Row: {
          id: string
          owner_id: string
          studio_id: string
          visited_at: string
          visitor_id: string
        }
        Insert: {
          id?: string
          owner_id: string
          studio_id: string
          visited_at?: string
          visitor_id: string
        }
        Update: {
          id?: string
          owner_id?: string
          studio_id?: string
          visited_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_visits_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studio_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json
          has_hd_quality: boolean
          has_voice_access: boolean
          id: string
          monthly_credits: number | null
          name: string
          price_monthly: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          features?: Json
          has_hd_quality?: boolean
          has_voice_access?: boolean
          id: string
          monthly_credits?: number | null
          name: string
          price_monthly: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          features?: Json
          has_hd_quality?: boolean
          has_voice_access?: boolean
          id?: string
          monthly_credits?: number | null
          name?: string
          price_monthly?: number
          sort_order?: number
        }
        Relationships: []
      }
      user_accessibility_settings: {
        Row: {
          audio_descriptions_enabled: boolean | null
          created_at: string
          focus_indicators_enhanced: boolean | null
          font_size_scale: number | null
          high_contrast_enabled: boolean | null
          id: string
          keyboard_navigation_enhanced: boolean | null
          reduced_motion_enabled: boolean | null
          screen_reader_optimized: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_descriptions_enabled?: boolean | null
          created_at?: string
          focus_indicators_enhanced?: boolean | null
          font_size_scale?: number | null
          high_contrast_enabled?: boolean | null
          id?: string
          keyboard_navigation_enhanced?: boolean | null
          reduced_motion_enabled?: boolean | null
          screen_reader_optimized?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_descriptions_enabled?: boolean | null
          created_at?: string
          focus_indicators_enhanced?: boolean | null
          font_size_scale?: number | null
          high_contrast_enabled?: boolean | null
          id?: string
          keyboard_navigation_enhanced?: boolean | null
          reduced_motion_enabled?: boolean | null
          screen_reader_optimized?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          notified: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          notified?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          notified?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_contributor_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_contributor_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "contributor_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          credits_earned: number
          credits_reset_at: string
          credits_spent: number
          has_hd_quality: boolean
          has_voice_access: boolean
          id: string
          monthly_credit_limit: number
          subscription_tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          credits_earned?: number
          credits_reset_at?: string
          credits_spent?: number
          has_hd_quality?: boolean
          has_voice_access?: boolean
          id?: string
          monthly_credit_limit?: number
          subscription_tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          credits_earned?: number
          credits_reset_at?: string
          credits_spent?: number
          has_hd_quality?: boolean
          has_voice_access?: boolean
          id?: string
          monthly_credit_limit?: number
          subscription_tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_dashboard_layouts: {
        Row: {
          id: string
          layout: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          layout?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_decorations: {
        Row: {
          decoration_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          decoration_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          decoration_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_decorations_decoration_id_fkey"
            columns: ["decoration_id"]
            isOneToOne: false
            referencedRelation: "studio_decorations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_event_participation: {
        Row: {
          completed_at: string | null
          event_id: string
          id: string
          joined_at: string
          progress: Json | null
          rewards_claimed: boolean
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          event_id: string
          id?: string
          joined_at?: string
          progress?: Json | null
          rewards_claimed?: boolean
          user_id: string
        }
        Update: {
          completed_at?: string | null
          event_id?: string
          id?: string
          joined_at?: string
          progress?: Json | null
          rewards_claimed?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_event_participation_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "studio_events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_levels: {
        Row: {
          current_level: number
          current_xp: number
          id: string
          quests_completed: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_level?: number
          current_xp?: number
          id?: string
          quests_completed?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_level?: number
          current_xp?: number
          id?: string
          quests_completed?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          audience_type: string
          completed_at: string | null
          completed_steps: string[]
          id: string
          is_complete: boolean
          started_at: string
          user_id: string
        }
        Insert: {
          audience_type?: string
          completed_at?: string | null
          completed_steps?: string[]
          id?: string
          is_complete?: boolean
          started_at?: string
          user_id: string
        }
        Update: {
          audience_type?: string
          completed_at?: string | null
          completed_steps?: string[]
          id?: string
          is_complete?: boolean
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quests: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          progress: number
          quest_id: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          quest_id: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          quest_id?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          current_streak: number
          id: string
          last_active_date: string
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_active_date?: string
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_active_date?: string
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_studio_placements: {
        Row: {
          decoration_id: string
          id: string
          placed_at: string
          position_x: number | null
          position_y: number | null
          rotation: number | null
          scale: number | null
          studio_id: string
          user_id: string
        }
        Insert: {
          decoration_id: string
          id?: string
          placed_at?: string
          position_x?: number | null
          position_y?: number | null
          rotation?: number | null
          scale?: number | null
          studio_id: string
          user_id: string
        }
        Update: {
          decoration_id?: string
          id?: string
          placed_at?: string
          position_x?: number | null
          position_y?: number | null
          rotation?: number | null
          scale?: number | null
          studio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_studio_placements_decoration_id_fkey"
            columns: ["decoration_id"]
            isOneToOne: false
            referencedRelation: "studio_decorations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_studio_placements_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studio_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_studios: {
        Row: {
          id: string
          is_active: boolean | null
          studio_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          studio_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          studio_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_studios_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studio_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_unlocked_personas: {
        Row: {
          id: string
          persona_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          persona_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          persona_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_unlocked_personas_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_unlocked_themes: {
        Row: {
          credits_spent: number | null
          id: string
          theme_id: string
          unlock_method: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          credits_spent?: number | null
          id?: string
          theme_id: string
          unlock_method?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          credits_spent?: number | null
          id?: string
          theme_id?: string
          unlock_method?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      access_playlist_by_share_code: {
        Args: { p_share_code: string }
        Returns: Json
      }
      award_contributor_badge: {
        Args: { p_badge_id: string; p_user_id: string }
        Returns: Json
      }
      can_view_profile: { Args: { target_user_id: string }; Returns: boolean }
      check_and_deduct_credit: {
        Args: { p_amount?: number; p_user_id: string }
        Returns: Json
      }
      claim_quest_reward: {
        Args: { p_quest_id: string; p_user_id: string }
        Returns: Json
      }
      create_playlist_share_code: {
        Args: { p_playlist_id: string }
        Returns: Json
      }
      generate_secure_share_code: { Args: never; Returns: string }
      get_user_subscription: { Args: { p_user_id: string }; Returns: Json }
      log_child_activity: {
        Args: {
          p_activity_details?: Json
          p_activity_type: string
          p_child_user_id: string
        }
        Returns: Json
      }
      mark_achievement_notified: {
        Args: { p_achievement_id: string; p_user_id: string }
        Returns: Json
      }
      record_daily_usage: {
        Args: { p_generations?: number; p_minutes?: number; p_user_id: string }
        Returns: Json
      }
      record_studio_visit: {
        Args: { p_owner_id: string; p_studio_id: string; p_visitor_id: string }
        Returns: Json
      }
      request_parental_control: {
        Args: { p_child_user_id: string; p_parent_user_id: string }
        Returns: Json
      }
      respond_to_parental_request: {
        Args: {
          p_child_user_id: string
          p_parent_user_id: string
          p_response: string
          p_verification_code?: string
        }
        Returns: Json
      }
      revoke_playlist_share_code: {
        Args: { p_playlist_id: string }
        Returns: Json
      }
      set_active_studio: {
        Args: { p_studio_id: string; p_user_id: string }
        Returns: Json
      }
      start_quest: {
        Args: { p_quest_id: string; p_user_id: string }
        Returns: Json
      }
      unlock_achievement: {
        Args: { p_achievement_id: string; p_user_id: string }
        Returns: Json
      }
      unlock_persona_with_credits: {
        Args: { p_persona_id: string; p_user_id: string }
        Returns: Json
      }
      unlock_studio: {
        Args: { p_studio_id: string; p_user_id: string }
        Returns: Json
      }
      unlock_theme_with_credits: {
        Args: { p_cost: number; p_theme_id: string; p_user_id: string }
        Returns: Json
      }
      update_quest_progress: {
        Args: {
          p_increment?: number
          p_requirement_type: string
          p_user_id: string
        }
        Returns: Json
      }
      update_user_streak: { Args: { p_user_id: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
