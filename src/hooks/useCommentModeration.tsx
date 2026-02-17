import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  reason: string;
  moderatedComment: string;
  needsReview?: boolean;
}

export function useCommentModeration() {
  const [isModeratingComment, setIsModeratingComment] = useState(false);

  const moderateComment = async (comment: string): Promise<ModerationResult> => {
    setIsModeratingComment(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('moderate-comment', {
        body: { comment }
      });

      if (error) {
        console.error('Moderation error:', error);
        // Fallback - allow but flag
        return {
          isAppropriate: true,
          confidence: 0.5,
          reason: 'Moderation service unavailable',
          moderatedComment: comment,
          needsReview: true
        };
      }

      return data as ModerationResult;
    } catch (err) {
      console.error('Failed to moderate comment:', err);
      return {
        isAppropriate: true,
        confidence: 0.5,
        reason: 'Error connecting to moderation',
        moderatedComment: comment,
        needsReview: true
      };
    } finally {
      setIsModeratingComment(false);
    }
  };

  return {
    moderateComment,
    isModeratingComment
  };
}
