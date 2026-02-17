import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Heart, MessageCircle, Eye, Send, 
  Trash2, Clock, Sparkles, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useStudioSocial } from '@/hooks/useStudioSocial';
import { useAuth } from '@/hooks/useAuth';
import type { StudioSpace } from '@/hooks/useStudioSpaces';
import { formatDistanceToNow } from 'date-fns';

interface StudioVisitorsPanelProps {
  activeStudio: StudioSpace | null;
  className?: string;
}

export function StudioVisitorsPanel({ activeStudio, className }: StudioVisitorsPanelProps) {
  const { user } = useAuth();
  const { 
    visits, 
    likes, 
    comments, 
    toggleLike, 
    addComment, 
    deleteComment, 
    hasUserLiked,
    likesCount,
  } = useStudioSocial(activeStudio?.id, user?.id);

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !activeStudio || !user) return;
    
    setIsSubmitting(true);
    await addComment(activeStudio.id, user.id, newComment);
    setNewComment('');
    setIsSubmitting(false);
  };

  const handleToggleLike = async () => {
    if (!activeStudio || !user) return;
    await toggleLike(activeStudio.id, user.id);
  };

  const isLiked = hasUserLiked();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Bar */}
      <motion.div
        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center gap-6">
          {/* Visitors Count */}
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <Eye className="w-5 h-5 text-muted-foreground" />
            <span className="font-bold">{visits.length}</span>
            <span className="text-sm text-muted-foreground">visits</span>
          </motion.div>
          
          {/* Likes */}
          <motion.button
            className={cn(
              "flex items-center gap-2 transition-colors min-h-[44px] px-3 rounded-lg touch-manipulation active:bg-muted/30",
              isLiked && "text-rose-400"
            )}
            whileTap={{ scale: 0.95 }}
            onPointerDown={(e) => {
              if (e.pointerType === 'touch') {
                handleToggleLike();
              }
            }}
            onClick={(e) => {
              if ((e as any).pointerType === 'touch') return;
              handleToggleLike();
            }}
            aria-label={isLiked ? 'Unlike studio' : 'Like studio'}
          >
            <motion.div
              animate={isLiked ? { scale: [1, 1.3, 1] } : undefined}
            >
              <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
            </motion.div>
            <span className="font-bold">{likesCount}</span>
            <span className="text-sm text-muted-foreground hidden sm:inline">likes</span>
          </motion.button>
          
          {/* Comments */}
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            <span className="font-bold">{comments.length}</span>
            <span className="text-sm text-muted-foreground">comments</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Visitors */}
        <motion.div
          className="rounded-xl border bg-card/50 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Recent Visitors</h3>
            <Badge variant="secondary" className="ml-auto">
              {visits.length}
            </Badge>
          </div>
          
          <ScrollArea className="h-[250px]">
            {visits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No visitors yet</p>
                <p className="text-xs">Share your studio to get visitors!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {visits.map((visit, index) => (
                    <motion.div
                      key={visit.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-primary/20">
                          👤
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Visitor</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(visit.visited_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </motion.div>

        {/* Comments Section */}
        <motion.div
          className="rounded-xl border bg-card/50 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Comments</h3>
            <Badge variant="secondary" className="ml-auto">
              {comments.length}
            </Badge>
          </div>
          
          <ScrollArea className="h-[180px] mb-3">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No comments yet</p>
                <p className="text-xs">Be the first to leave a comment!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {comments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      className="p-3 rounded-lg bg-muted/30"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {comment.user_id === user?.id ? '🌟' : '👤'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {comment.user_id === user?.id ? 'You' : 'Visitor'}
                            </span>
                            {comment.user_id === user?.id && (
                              <Crown className="w-3 h-3 text-amber-400" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                        {comment.user_id === user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-11 h-11 min-w-[44px] min-h-[44px] opacity-50 hover:opacity-100 touch-manipulation"
                            onClick={() => deleteComment(comment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>

          {/* Comment Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Leave a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              className="flex-1"
              disabled={isSubmitting}
            />
            <Button
              size="icon"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
