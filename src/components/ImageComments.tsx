import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCommentModeration } from '@/hooks/useCommentModeration';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { SciFiButton } from './ui/sci-fi-button';
import { SciFiInput } from './ui/sci-fi-input';
import { Skeleton } from './ui/skeleton';
import { MessageCircle, Send, Shield, AlertTriangle, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_child_friendly: boolean;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface ImageCommentsProps {
  imageId: string;
}

export function ImageComments({ imageId }: ImageCommentsProps) {
  const { user } = useAuth();
  const haptic = useHapticFeedback();
  const { moderateComment, isModeratingComment } = useCommentModeration();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [imageId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('image_comments')
        .select('*')
        .eq('image_id', imageId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for comments
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedComments = (data || []).map(comment => ({
        ...comment,
        profile: profileMap.get(comment.user_id)
      }));

      setComments(enrichedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    if (newComment.trim().length > 500) {
      toast.error('Comment is too long (max 500 characters)');
      return;
    }

    setSubmitting(true);
    setModerationWarning(null);
    haptic.trigger('selection');

    try {
      // First, moderate the comment
      const modResult = await moderateComment(newComment.trim());

      if (!modResult.isAppropriate) {
        haptic.trigger('error');
        setModerationWarning(modResult.reason || 'This comment may not be appropriate for our community.');
        
        // If AI suggested a friendlier version, offer it
        if (modResult.moderatedComment && modResult.moderatedComment !== newComment.trim()) {
          toast.error(
            `Your comment was flagged. Try: "${modResult.moderatedComment}"`,
            { duration: 6000 }
          );
          setNewComment(modResult.moderatedComment);
        } else {
          toast.error('Please write a friendlier comment for our community!');
        }
        setSubmitting(false);
        return;
      }

      // Comment is appropriate, save it
      const { error } = await supabase
        .from('image_comments')
        .insert({
          image_id: imageId,
          user_id: user.id,
          content: modResult.moderatedComment || newComment.trim(),
          is_child_friendly: modResult.confidence > 0.8
        });

      if (error) throw error;

      haptic.trigger('success');
      toast.success('Comment posted!');
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      haptic.trigger('error');
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;

    haptic.trigger('selection');
    
    try {
      const { error } = await supabase
        .from('image_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      haptic.trigger('success');
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      haptic.trigger('error');
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-display">Comments ({comments.length})</span>
        <Shield className="w-3 h-3 text-neon-cyan ml-auto" />
        <span className="text-xs text-neon-cyan">AI Moderated</span>
      </div>

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <SciFiInput
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setModerationWarning(null);
              }}
              placeholder="Share a kind comment..."
              className="flex-1"
              maxLength={500}
              disabled={submitting || isModeratingComment}
            />
            <SciFiButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting || isModeratingComment || !newComment.trim()}
            >
              {isModeratingComment ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </SciFiButton>
          </div>
          
          {/* Moderation Warning */}
          <AnimatePresence>
            {moderationWarning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-200">{moderationWarning}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-xs text-muted-foreground">
            Be kind and encouraging! Comments are reviewed by AI to keep our community friendly.
          </p>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Please sign in to comment
        </p>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {loading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first!
          </p>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex gap-3 p-3 rounded-lg bg-space-dark/50 border border-border/30"
              >
                <div className="w-8 h-8 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center flex-shrink-0">
                  {comment.profile?.avatar_url ? (
                    <img 
                      src={comment.profile.avatar_url} 
                      alt="" 
                      className="w-full h-full rounded-full object-cover" 
                    />
                  ) : (
                    <Users className="w-4 h-4 text-neon-cyan" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground truncate">
                      {comment.profile?.display_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'MMM d')}
                    </span>
                    {comment.is_child_friendly && (
                      <Shield className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground break-words">
                    {comment.content}
                  </p>
                </div>

                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-muted-foreground hover:text-red-400 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90"
                    title="Delete comment"
                  >
                    <Trash2 className="w-4 h-4 pointer-events-none" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
