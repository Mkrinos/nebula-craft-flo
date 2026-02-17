import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string | null;
  category: string;
  duration_seconds: number | null;
  file_path: string;
  file_url?: string;
  is_default: boolean;
  sort_order: number;
}

export const useMusicTracks = () => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('music_tracks')
        .select('*')
        .order('category')
        .order('sort_order');

      if (error) throw error;

      // Get public URLs for each track
      const tracksWithUrls = await Promise.all(
        (data || []).map(async (track) => {
          const { data: urlData } = supabase.storage
            .from('music')
            .getPublicUrl(track.file_path);
          
          return {
            ...track,
            file_url: urlData.publicUrl
          };
        })
      );

      setTracks(tracksWithUrls);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadTrack = async (
    file: File,
    metadata: { title: string; artist?: string; category: string }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload music",
          variant: "destructive"
        });
        return null;
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create metadata record
      const { data, error } = await supabase
        .from('music_tracks')
        .insert({
          title: metadata.title,
          artist: metadata.artist || null,
          category: metadata.category,
          file_path: fileName,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Track uploaded!",
        description: `"${metadata.title}" has been added to your playlist`
      });

      await fetchTracks();
      return data;
    } catch (error: any) {
      console.error('Error uploading track:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteTrack = async (trackId: string, filePath: string) => {
    try {
      // Delete from storage
      await supabase.storage.from('music').remove([filePath]);
      
      // Delete metadata
      const { error } = await supabase
        .from('music_tracks')
        .delete()
        .eq('id', trackId);

      if (error) throw error;

      toast({
        title: "Track removed",
        description: "The track has been deleted"
      });

      await fetchTracks();
    } catch (error: any) {
      console.error('Error deleting track:', error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  return {
    tracks,
    isLoading,
    uploadTrack,
    deleteTrack,
    refetch: fetchTracks
  };
};
