import React, { useState } from 'react';
import { Copy, Check, Share2, Users, Link, Send, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useFriends, Friend } from '@/hooks/useFriends';
import { supabase } from '@/integrations/supabase/client';
import { Playlist } from '@/hooks/usePlaylists';
import { cn } from '@/lib/utils';

interface PlaylistShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist | null;
}

export const PlaylistShareDialog: React.FC<PlaylistShareDialogProps> = ({
  open,
  onOpenChange,
  playlist
}) => {
  const { toast } = useToast();
  const { friends, pendingRequests, sendFriendRequest, respondToRequest } = useFriends();
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [sharedWith, setSharedWith] = useState<Set<string>>(new Set());

  const generateShareLink = async () => {
    if (!playlist) return;
    
    try {
      const shareCode = `${playlist.id.slice(0, 8)}-${Date.now().toString(36)}`;
      
      const { error } = await supabase
        .from('playlists')
        .update({ share_code: shareCode })
        .eq('id', playlist.id);

      if (error) throw error;

      const link = `${window.location.origin}/shared-playlist/${shareCode}`;
      setShareLink(link);
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Failed to generate link",
        variant: "destructive"
      });
    }
  };

  const copyLink = async () => {
    if (!shareLink) {
      await generateShareLink();
    }
    
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWithFriend = async (friend: Friend) => {
    if (!playlist) return;
    
    const friendUserId = friend.friend_profile?.id;
    if (!friendUserId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('shared_playlists')
        .insert({
          playlist_id: playlist.id,
          shared_by: user.id,
          shared_with: friendUserId
        });

      if (error) {
        if (error.code === '23505') {
          toast({ title: "Already shared with this friend" });
        } else {
          throw error;
        }
        return;
      }

      setSharedWith(prev => new Set([...prev, friendUserId]));
      toast({
        title: "Playlist shared!",
        description: `${friend.friend_profile?.display_name || 'Friend'} can now listen too`
      });
    } catch (error) {
      console.error('Error sharing playlist:', error);
      toast({
        title: "Failed to share",
        variant: "destructive"
      });
    }
  };

  const handleAddFriend = async () => {
    if (!friendEmail.trim()) return;
    
    setIsAddingFriend(true);
    const success = await sendFriendRequest(friendEmail.trim());
    if (success) {
      setFriendEmail('');
    }
    setIsAddingFriend(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share "{playlist?.name}"
          </DialogTitle>
          <DialogDescription>
            Share your playlist with friends or create a link!
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Copy Link
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Friends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Anyone with this link can view your playlist
            </p>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                placeholder="Click to generate link"
                className="flex-1"
              />
              <Button onClick={copyLink}>
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="friends" className="space-y-4 pt-4">
            {/* Add friend */}
            <div className="space-y-2">
              <Label>Add a friend</Label>
              <div className="flex gap-2">
                <Input
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  placeholder="Friend's email..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                />
                <Button 
                  onClick={handleAddFriend} 
                  disabled={isAddingFriend}
                  size="icon"
                  className="min-h-[44px] min-w-[44px]"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Pending requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Friend requests ({pendingRequests.length})
                </Label>
                <div className="space-y-1">
                  {pendingRequests.map(request => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {request.friend_profile?.display_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {request.friend_profile?.display_name || 'Someone'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => respondToRequest(request.id, true)}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => respondToRequest(request.id, false)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends list */}
            <div className="space-y-2">
              <Label>Share with friends</Label>
              {friends.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No friends yet</p>
                  <p className="text-xs">Add friends to share playlists!</p>
                </div>
              ) : (
                <ScrollArea className="h-40">
                  <div className="space-y-1">
                    {friends.map(friend => {
                      const isShared = sharedWith.has(friend.friend_profile?.id || '');
                      return (
                        <div
                          key={friend.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg transition-colors",
                            isShared ? "bg-primary/10" : "hover:bg-muted"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                {friend.friend_profile?.display_name?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {friend.friend_profile?.display_name || 'Friend'}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant={isShared ? "ghost" : "secondary"}
                            onClick={() => shareWithFriend(friend)}
                            disabled={isShared}
                          >
                            {isShared ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-1" />
                                Share
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
