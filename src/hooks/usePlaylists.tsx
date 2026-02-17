import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MusicTrack } from './useMusicTracks';

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  is_public: boolean;
  created_at: string;
  track_count?: number;
}

export interface PlaylistWithTracks extends Playlist {
  tracks: MusicTrack[];
}

export const usePlaylists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlaylists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPlaylists([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_tracks(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const playlistsWithCount = (data || []).map(playlist => ({
        ...playlist,
        track_count: playlist.playlist_tracks?.[0]?.count || 0
      }));

      setPlaylists(playlistsWithCount);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPlaylist = async (name: string, description?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create playlists",
          variant: "destructive"
        });
        return null;
      }

      const { data, error } = await supabase
        .from('playlists')
        .insert({
          name,
          description: description || null,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Playlist created!",
        description: `"${name}" is ready for your favorite songs`
      });

      await fetchPlaylists();
      return data;
    } catch (error: any) {
      console.error('Error creating playlist:', error);
      toast({
        title: "Failed to create playlist",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;

      toast({
        title: "Playlist deleted",
        description: "The playlist has been removed"
      });

      await fetchPlaylists();
    } catch (error: any) {
      console.error('Error deleting playlist:', error);
      toast({
        title: "Failed to delete playlist",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const renamePlaylist = async (playlistId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('id', playlistId);

      if (error) throw error;

      toast({
        title: "Playlist renamed",
        description: `Now called "${newName}"`
      });

      await fetchPlaylists();
    } catch (error: any) {
      console.error('Error renaming playlist:', error);
      toast({
        title: "Failed to rename playlist",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: trackId
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already in playlist",
            description: "This song is already in the playlist"
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Added to playlist!",
        description: "Song added successfully"
      });

      await fetchPlaylists();
    } catch (error: any) {
      console.error('Error adding track to playlist:', error);
      toast({
        title: "Failed to add track",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);

      if (error) throw error;

      toast({
        title: "Removed from playlist",
        description: "Song removed successfully"
      });

      await fetchPlaylists();
    } catch (error: any) {
      console.error('Error removing track from playlist:', error);
      toast({
        title: "Failed to remove track",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getPlaylistTracks = async (playlistId: string): Promise<MusicTrack[]> => {
    try {
      const { data, error } = await supabase
        .from('playlist_tracks')
        .select(`
          sort_order,
          music_tracks (*)
        `)
        .eq('playlist_id', playlistId)
        .order('sort_order');

      if (error) throw error;

      const tracks = (data || [])
        .map(item => item.music_tracks)
        .filter(Boolean) as MusicTrack[];

      // Get public URLs for each track
      const tracksWithUrls = await Promise.all(
        tracks.map(async (track) => {
          const { data: urlData } = supabase.storage
            .from('music')
            .getPublicUrl(track.file_path);
          
          return {
            ...track,
            file_url: urlData.publicUrl
          };
        })
      );

      return tracksWithUrls;
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      return [];
    }
  };

  const reorderPlaylistTracks = async (playlistId: string, trackIds: string[]) => {
    try {
      // Update sort_order for each track
      const updates = trackIds.map((trackId, index) => 
        supabase
          .from('playlist_tracks')
          .update({ sort_order: index })
          .eq('playlist_id', playlistId)
          .eq('track_id', trackId)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error reordering tracks:', error);
      toast({
        title: "Failed to reorder",
        description: "Could not save the new order",
        variant: "destructive"
      });
    }
  };

  // Generate a secure share code using RPC function
  const generateShareCode = async (playlistId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('create_playlist_share_code', {
        p_playlist_id: playlistId
      });

      if (error) throw error;

      const result = data as { success?: boolean; share_code?: string; error?: string } | null;
      if (!result?.success) {
        toast({
          title: "Failed to generate share link",
          description: result?.error || "Unknown error",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Share link created!",
        description: "Your playlist can now be shared securely"
      });

      await fetchPlaylists();
      return result.share_code ?? null;
    } catch (error: any) {
      console.error('Error generating share code:', error);
      toast({
        title: "Failed to generate share link",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  // Revoke share code using RPC function
  const revokeShareCode = async (playlistId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('revoke_playlist_share_code', {
        p_playlist_id: playlistId
      });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string } | null;
      if (!result?.success) {
        toast({
          title: "Failed to revoke share link",
          description: result?.error || "Unknown error",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Share link revoked",
        description: "The playlist is no longer shared"
      });

      await fetchPlaylists();
      return true;
    } catch (error: any) {
      console.error('Error revoking share code:', error);
      toast({
        title: "Failed to revoke share link",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Access a playlist using a share code (grants access via shared_playlists table)
  const accessPlaylistByShareCode = async (shareCode: string): Promise<{ success: boolean; playlistId?: string; name?: string; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('access_playlist_by_share_code', {
        p_share_code: shareCode
      });

      if (error) throw error;

      const result = data as { success?: boolean; playlist_id?: string; name?: string; error?: string; already_owner?: boolean } | null;
      if (!result?.success) {
        return { success: false, error: result?.error || 'Failed to access playlist' };
      }

      if (!result.already_owner) {
        toast({
          title: "Playlist unlocked!",
          description: `You now have access to "${result.name}"`
        });
      }

      await fetchPlaylists();
      return { success: true, playlistId: result.playlist_id, name: result.name };
    } catch (error: any) {
      console.error('Error accessing playlist by share code:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  return {
    playlists,
    isLoading,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    getPlaylistTracks,
    reorderPlaylistTracks,
    generateShareCode,
    revokeShareCode,
    accessPlaylistByShareCode,
    refetch: fetchPlaylists
  };
};
