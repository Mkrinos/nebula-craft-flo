import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { TouchTriggerButton } from '@/components/ui/touch-trigger-button';

const typeStyles: Record<Notification['type'], string> = {
  achievement: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
  quest: 'bg-primary/20 border-primary/50 text-primary',
  social: 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan',
  system: 'bg-muted border-border text-muted-foreground',
  credits: 'bg-green-500/20 border-green-500/50 text-green-400',
};

const typeIcons: Record<Notification['type'], string> = {
  achievement: '🏆',
  quest: '🎯',
  social: '👋',
  system: '📢',
  credits: '💰',
};

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <TouchTriggerButton
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'relative h-9 w-9')}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </TouchTriggerButton>
      </PopoverTrigger>

      <PopoverContent 
        align="end" 
        className="w-80 sm:w-96 p-0 border-neon-cyan/30 bg-background/95 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-display font-bold text-sm">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs min-h-[36px] touch-manipulation"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 min-h-[36px] min-w-[36px] text-muted-foreground hover:text-destructive touch-manipulation"
                onClick={clearNotifications}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                We'll notify you about achievements, quests, and more
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => {
                let touchTriggered = false;
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'p-3 hover:bg-muted/50 active:bg-muted/70 transition-colors cursor-pointer touch-manipulation min-h-[48px]',
                      !notification.read && 'bg-primary/5'
                    )}
                    onPointerDown={(e) => {
                      if (e.pointerType === 'touch') {
                        touchTriggered = true;
                        markAsRead(notification.id);
                      }
                    }}
                    onClick={() => {
                      if (touchTriggered) {
                        touchTriggered = false;
                        return;
                      }
                      markAsRead(notification.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 border',
                          typeStyles[notification.type]
                        )}
                      >
                        {notification.icon || typeIcons[notification.type]}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            notification.read ? 'text-muted-foreground' : 'text-foreground'
                          )}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
