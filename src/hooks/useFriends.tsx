import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  friend_profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFriends([]);
        setPendingRequests([]);
        setIsLoading(false);
        return;
      }

      // Get all friendships where user is involved
      const { data, error } = await supabase
        .from('user_friends')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (error) throw error;

      const friendships = data || [];
      
      // Separate accepted friends and pending requests
      const accepted = friendships.filter(f => f.status === 'accepted');
      const pending = friendships.filter(f => f.status === 'pending' && f.friend_id === user.id);

      // Fetch profiles for friends
      const friendIds = accepted.map(f => f.user_id === user.id ? f.friend_id : f.user_id);
      const pendingIds = pending.map(f => f.user_id);
      
      const allIds = [...new Set([...friendIds, ...pendingIds])];
      
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', allIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const friendsWithProfiles = accepted.map(f => ({
          ...f,
          friend_profile: profileMap.get(f.user_id === user.id ? f.friend_id : f.user_id)
        }));

        const pendingWithProfiles = pending.map(f => ({
          ...f,
          friend_profile: profileMap.get(f.user_id)
        }));

        setFriends(friendsWithProfiles as Friend[]);
        setPendingRequests(pendingWithProfiles as Friend[]);
      } else {
        setFriends([]);
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (friendDisplayName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add friends",
          variant: "destructive"
        });
        return false;
      }

      // Find user by display name (case-insensitive)
      const { data: profileResults } = await supabase
        .from('profiles')
        .select('id, display_name')
        .ilike('display_name', friendDisplayName);

      const profiles = profileResults && profileResults.length > 0 ? profileResults[0] : null;

      if (!profiles) {
        toast({
          title: "User not found",
          description: "No user found with that display name",
          variant: "destructive"
        });
        return false;
      }

      if (profiles.id === user.id) {
        toast({
          title: "Oops!",
          description: "You can't add yourself as a friend",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('user_friends')
        .insert({
          user_id: user.id,
          friend_id: profiles.id,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already friends",
            description: "You already have a connection with this user"
          });
        } else {
          throw error;
        }
        return false;
      }

      toast({
        title: "Friend request sent!",
        description: `Request sent to ${profiles.display_name || friendDisplayName}`
      });

      await fetchFriends();
      return true;
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    try {
      if (accept) {
        const { error } = await supabase
          .from('user_friends')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', requestId);

        if (error) throw error;

        toast({
          title: "Friend added!",
          description: "You can now share playlists with each other"
        });
      } else {
        const { error } = await supabase
          .from('user_friends')
          .delete()
          .eq('id', requestId);

        if (error) throw error;

        toast({
          title: "Request declined"
        });
      }

      await fetchFriends();
    } catch (error: any) {
      console.error('Error responding to request:', error);
      toast({
        title: "Failed to respond",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('user_friends')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Friend removed"
      });

      await fetchFriends();
    } catch (error: any) {
      console.error('Error removing friend:', error);
      toast({
        title: "Failed to remove friend",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  return {
    friends,
    pendingRequests,
    isLoading,
    sendFriendRequest,
    respondToRequest,
    removeFriend,
    refetch: fetchFriends
  };
};
