import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  ChevronDown,
  Trash2,
  Plus,
  ListMusic,
  FolderPlus,
  MoreVertical,
  Edit2,
  Check,
  X,
  GripVertical,
  Share2,
  Upload,
  Loader2
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { createDndKitHaptics } from '@/hooks/useReorderHaptics';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { TouchTriggerButton } from '@/components/ui/touch-trigger-button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMusicTracks, MusicTrack } from '@/hooks/useMusicTracks';
import { usePlaylists, Playlist } from '@/hooks/usePlaylists';
import { useMusicContext } from '@/contexts/MusicContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { FloatingMusicButton } from './FloatingMusicButton';
import { MusicUploadDialog } from './MusicUploadDialog';
import { PlaylistShareDialog } from './PlaylistShareDialog';
import { AudioVisualizer, AnimatedVisualizer } from './AudioVisualizer';

const CATEGORIES = [
  { id: 'all', label: '✨ All' },
  { id: 'ambient', label: '🌌 Ambient' },
  { id: 'upbeat', label: '🎉 Upbeat' },
  { id: 'nature', label: '🌿 Nature' },
  { id: 'relaxing', label: '😌 Relaxing' },
  { id: 'synthwave', label: '🤖 Sci-Fi/Synthwave' }
];

// Sortable track item component
interface SortableTrackItemProps {
  track: MusicTrack;
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  onPlay: (track: MusicTrack) => void;
  onRemove: (trackId: string) => void;
  isDraggable: boolean;
}

const SortableTrackItem: React.FC<SortableTrackItemProps> = ({
  track,
  currentTrack,
  isPlaying,
  onPlay,
  onRemove,
  isDraggable,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group",
        currentTrack?.id === track.id
          ? "bg-primary/20 text-primary"
          : "hover:bg-muted",
        isDragging && "opacity-50 bg-muted"
      )}
    >
      {isDraggable && (
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      <div
        className="flex items-center gap-2 flex-1 min-w-0"
        onClick={() => onPlay(track)}
      >
        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
          {currentTrack?.id === track.id && isPlaying ? (
            <motion.div
              className="flex gap-0.5"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-primary rounded-full"
                  animate={{ height: ['8px', '16px', '8px'] }}
                  transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                />
              ))}
            </motion.div>
          ) : (
            <Play className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{track.title}</p>
          {track.artist && (
            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
          )}
        </div>
      </div>
      {/* Remove from playlist button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(track.id);
        }}
        className="w-7 h-7 rounded-full border border-destructive/40 bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors shrink-0"
        title="Remove from playlist"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

type ViewMode = 'tracks' | 'playlists' | 'playlist-detail';

export const MusicPlayer: React.FC = () => {
  const { tracks, isLoading, uploadTrack, deleteTrack, refetch } = useMusicTracks();
  const { 
    playlists, 
    createPlaylist, 
    deletePlaylist, 
    renamePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    getPlaylistTracks,
    reorderPlaylistTracks
  } = usePlaylists();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use global music context for persistent playback
  const {
    isPlaying,
    currentTrack,
    volume,
    isMuted,
    progress,
    visualizerMode,
    setVisualizerMode,
    playTrack: contextPlayTrack,
    togglePlay,
    setVolume,
    toggleMute,
    playNext,
    playPrevious,
    setPlaylist,
    audioRef
  } = useMusicContext();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('tracks');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<MusicTrack[]>([]);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingPlaylistName, setEditingPlaylistName] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [playlistToShare, setPlaylistToShare] = useState<Playlist | null>(null);
  const [trackToDelete, setTrackToDelete] = useState<MusicTrack | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ track: MusicTrack; timeoutId: NodeJS.Timeout } | null>(null);

  const pendingDeleteId = pendingDelete?.track.id;

  const filteredTracks = useMemo(() => {
    return tracks.filter(
      (track) => selectedCategory === 'all' || track.category === selectedCategory
    );
  }, [tracks, selectedCategory]);

  // Filter out tracks that are pending deletion
  const visibleFilteredTracks = useMemo(() => {
    return filteredTracks.filter((track) => pendingDeleteId !== track.id);
  }, [filteredTracks, pendingDeleteId]);

  const visiblePlaylistTracks = useMemo(() => {
    return playlistTracks.filter((track) => pendingDeleteId !== track.id);
  }, [playlistTracks, pendingDeleteId]);

  const displayedTracks = useMemo(() => {
    return viewMode === 'playlist-detail' ? visiblePlaylistTracks : visibleFilteredTracks;
  }, [viewMode, visiblePlaylistTracks, visibleFilteredTracks]);

  // Update global playlist when displayed tracks change
  useEffect(() => {
    setPlaylist(displayedTracks);
  }, [displayedTracks, setPlaylist]);

  const loadPlaylistTracks = async (playlist: Playlist) => {
    const loadedTracks = await getPlaylistTracks(playlist.id);
    setPlaylistTracks(loadedTracks);
    setSelectedPlaylist(playlist);
    setViewMode('playlist-detail');
  };

  // Wrapper to use context's playTrack with MusicTrack type
  const playTrack = (track: MusicTrack) => {
    contextPlayTrack(track);
  };

  const handleUploadWithCategory = async (file: File, metadata: { title: string; artist?: string; category: string }) => {
    await uploadTrack(file, metadata);
  };

  const handleDeleteTrack = (track: MusicTrack) => {
    setTrackToDelete(track);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTrack = () => {
    if (!trackToDelete) return;
    
    const trackName = trackToDelete.title;
    const trackData = trackToDelete;
    
    // Stop playback if this track is playing (use context's pause)
    if (currentTrack?.id === trackData.id) {
      audioRef.current?.pause();
    }
    
    // Set up delayed deletion with undo option
    const timeoutId = setTimeout(async () => {
      await deleteTrack(trackData.id, trackData.file_path);
      setPendingDelete(null);
    }, 5000);
    
    setPendingDelete({ track: trackData, timeoutId });
    setTrackToDelete(null);
    setShowDeleteConfirm(false);
    
    // Show toast with undo button
    toast({
      title: "Track deleted",
      description: `"${trackName}" has been removed`,
      action: (
        <button
          onClick={() => {
            clearTimeout(timeoutId);
            setPendingDelete(null);
            refetch();
            toast({
              title: "Deletion cancelled",
              description: `"${trackName}" has been restored`,
            });
          }}
          className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Undo
        </button>
      ),
    });
  };

  const openShareDialog = (playlist: Playlist) => {
    setPlaylistToShare(playlist);
    setShowShareDialog(true);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreatingPlaylist(false);
  };

  const handleRenamePlaylist = async (playlistId: string) => {
    if (!editingPlaylistName.trim()) return;
    await renamePlaylist(playlistId, editingPlaylistName.trim());
    setEditingPlaylistId(null);
    setEditingPlaylistName('');
  };

  const handleRemoveFromPlaylist = async (trackId: string) => {
    if (!selectedPlaylist) return;
    await removeTrackFromPlaylist(selectedPlaylist.id, trackId);
    const updatedTracks = playlistTracks.filter(t => t.id !== trackId);
    setPlaylistTracks(updatedTracks);
  };

  // Haptic feedback for drag-and-drop
  const dndHaptics = createDndKitHaptics();

  const handleDragStart = (event: DragStartEvent) => {
    dndHaptics.onDragStart();
  };

  const handleDragOver = (event: DragOverEvent) => {
    dndHaptics.onDragOver({ over: event.over ? { id: String(event.over.id) } : null });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Trigger haptic feedback
    dndHaptics.onDragEnd({ 
      active: { id: String(active.id) }, 
      over: over ? { id: String(over.id) } : null 
    });
    
    if (!over || active.id === over.id || !selectedPlaylist) return;
    
    const oldIndex = playlistTracks.findIndex(t => t.id === active.id);
    const newIndex = playlistTracks.findIndex(t => t.id === over.id);
    
    const newOrder = arrayMove(playlistTracks, oldIndex, newIndex);
    setPlaylistTracks(newOrder);
    
    // Persist the new order
    await reorderPlaylistTracks(selectedPlaylist.id, newOrder.map(t => t.id));
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      {/* Audio element is now managed by MusicContext for persistent playback */}
      
      {/* Kid-friendly floating button when collapsed - positioned at the bottom */}
      {!isExpanded && (
        <div className="fixed bottom-24 md:bottom-20 right-4 z-30">
          <FloatingMusicButton 
            isPlaying={isPlaying} 
            onClick={() => setIsExpanded(true)}
            volume={volume}
            onVolumeChange={setVolume}
          />
        </div>
      )}
      
      {/* Expanded player panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className={cn(
              "fixed bottom-4 right-4 z-50",
              "bg-background/80 backdrop-blur-xl border border-primary/30",
              "rounded-2xl shadow-2xl shadow-primary/20",
              "overflow-hidden"
            )}
            initial={{ width: 60, height: 60, opacity: 0 }}
            animate={{ width: 340, height: 500, opacity: 1 }}
            exit={{ width: 60, height: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-primary/20">
                <div className="flex items-center gap-2">
                  {viewMode === 'playlist-detail' ? (
                    <button
                      onClick={() => setViewMode('playlists')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ListMusic className="w-5 h-5" />
                    </button>
                  ) : (
                    <Music className="w-5 h-5 text-primary" />
                  )}
                  <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                    {viewMode === 'playlist-detail' && selectedPlaylist 
                      ? selectedPlaylist.name 
                      : 'Creative Tunes'}
                  </span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* View toggle */}
              {user && viewMode !== 'playlist-detail' && (
                <div className="flex border-b border-primary/20">
                  <button
                    onClick={() => setViewMode('tracks')}
                    className={cn(
                      "flex-1 py-2 text-xs font-medium transition-colors",
                      viewMode === 'tracks' 
                        ? "text-primary border-b-2 border-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All Tracks
                  </button>
                  <button
                    onClick={() => setViewMode('playlists')}
                    className={cn(
                      "flex-1 py-2 text-xs font-medium transition-colors",
                      viewMode === 'playlists' 
                        ? "text-primary border-b-2 border-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    My Playlists
                  </button>
                </div>
              )}

              {/* Category filters - only in tracks view */}
              {viewMode === 'tracks' && (
                <div className="flex gap-1 p-2 overflow-x-auto">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors",
                        selectedCategory === cat.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Content area */}
              <ScrollArea className="flex-1 px-2">
                {viewMode === 'playlists' ? (
                  // Playlists view
                  <div className="space-y-1 py-2">
                    {isCreatingPlaylist ? (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <Input
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          placeholder="Playlist name..."
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreatePlaylist();
                            if (e.key === 'Escape') {
                              setIsCreatingPlaylist(false);
                              setNewPlaylistName('');
                            }
                          }}
                        />
                        <button
                          onClick={handleCreatePlaylist}
                          className="p-1 text-primary hover:text-primary/80"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsCreatingPlaylist(false);
                            setNewPlaylistName('');
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsCreatingPlaylist(true)}
                        className="flex items-center gap-2 w-full p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      >
                        <FolderPlus className="w-4 h-4" />
                        Create new playlist
                      </button>
                    )}

                    {/* Upload music button */}
                    <button
                      onClick={() => setShowUploadDialog(true)}
                      className="flex items-center gap-2 w-full p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload music
                    </button>

                    {playlists.length === 0 && !isCreatingPlaylist ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ListMusic className="w-10 h-10 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No playlists yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Create one to organize your songs!
                        </p>
                      </div>
                    ) : (
                      playlists.map(playlist => (
                        <div
                          key={playlist.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted group"
                        >
                          {editingPlaylistId === playlist.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editingPlaylistName}
                                onChange={(e) => setEditingPlaylistName(e.target.value)}
                                className="h-7 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenamePlaylist(playlist.id);
                                  if (e.key === 'Escape') {
                                    setEditingPlaylistId(null);
                                    setEditingPlaylistName('');
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleRenamePlaylist(playlist.id)}
                                className="p-1 text-primary hover:text-primary/80"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPlaylistId(null);
                                  setEditingPlaylistName('');
                                }}
                                className="p-1 text-muted-foreground hover:text-foreground"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => loadPlaylistTracks(playlist)}
                                className="flex items-center gap-2 flex-1 text-left"
                              >
                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                  <ListMusic className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{playlist.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {playlist.track_count || 0} songs
                                  </p>
                                </div>
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <TouchTriggerButton className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity">
                                    <MoreVertical className="w-4 h-4 pointer-events-none" />
                                  </TouchTriggerButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => openShareDialog(playlist)}
                                  >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingPlaylistId(playlist.id);
                                      setEditingPlaylistName(playlist.name);
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => deletePlaylist(playlist.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // Tracks view (all tracks or playlist detail)
                  <>
                    {displayedTracks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                        <Music className="w-10 h-10 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {viewMode === 'playlist-detail' ? 'No songs in this playlist' : 'No tracks yet'}
                        </p>
                        {user && viewMode !== 'playlist-detail' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload some music to get started!
                          </p>
                        )}
                      </div>
                    ) : viewMode === 'playlist-detail' && user ? (
                      // Sortable playlist tracks
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={playlistTracks.map(t => t.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-1 py-2">
                            {playlistTracks.map(track => (
                              <SortableTrackItem
                                key={track.id}
                                track={track}
                                currentTrack={currentTrack}
                                isPlaying={isPlaying}
                                onPlay={playTrack}
                                onRemove={handleRemoveFromPlaylist}
                                isDraggable={true}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      // Regular track list
                      <div className="space-y-1 py-2">
                        {displayedTracks.map((track) => (
                          <div
                            key={track.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group",
                              currentTrack?.id === track.id
                                ? "bg-primary/20 text-primary"
                                : "hover:bg-muted"
                            )}
                          >
                            {/* Left controls (Play + Transfer) */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded bg-primary/10 flex items-center justify-center touch-manipulation active:scale-90"
                                onClick={() => playTrack(track)}
                                aria-label={
                                  currentTrack?.id === track.id && isPlaying
                                    ? `Pause ${track.title}`
                                    : `Play ${track.title}`
                                }
                              >
                                {currentTrack?.id === track.id && isPlaying ? (
                                  <motion.div
                                    className="flex gap-0.5 pointer-events-none"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                  >
                                    {[1, 2, 3].map((i) => (
                                      <motion.div
                                        key={i}
                                        className="w-0.5 bg-primary rounded-full"
                                        animate={{ height: ['8px', '16px', '8px'] }}
                                        transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                                      />
                                    ))}
                                  </motion.div>
                                ) : (
                                  <Play className="w-4 h-4 text-primary pointer-events-none" />
                                )}
                              </button>

                              {/* Small circular + button (Transfer to playlist) */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <TouchTriggerButton
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-9 h-9 rounded-full border border-primary/40 bg-background/60 backdrop-blur flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                                    aria-label={`Transfer ${track.title} to playlist`}
                                    title="Transfer to playlist"
                                  >
                                    <Plus className="w-4 h-4 pointer-events-none" />
                                  </TouchTriggerButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="start"
                                  side="right"
                                  className="z-[100] bg-background border border-border shadow-lg"
                                >
                                  {user ? (
                                    <>
                                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                        Transfer song to
                                      </div>
                                      <DropdownMenuSeparator />
                                      {playlists.length > 0 ? (
                                        <>
                                          {playlists.map((playlist) => (
                                            <DropdownMenuItem
                                              key={playlist.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                addTrackToPlaylist(playlist.id, track.id);
                                              }}
                                              className="cursor-pointer"
                                            >
                                              <ListMusic className="w-4 h-4 mr-2" />
                                              {playlist.name}
                                            </DropdownMenuItem>
                                          ))}
                                          <DropdownMenuSeparator />
                                        </>
                                      ) : null}
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewMode('playlists');
                                          setIsCreatingPlaylist(true);
                                        }}
                                        className="text-primary cursor-pointer"
                                      >
                                        <FolderPlus className="w-4 h-4 mr-2" />
                                        New Playlist
                                      </DropdownMenuItem>
                                    </>
                                  ) : (
                                    <div className="px-3 py-2 text-xs text-muted-foreground">
                                      Sign in to create playlists
                                    </div>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {/* Delete button - on the left side */}
                              {user && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTrack(track);
                                  }}
                                  className="w-9 h-9 min-h-[44px] min-w-[44px] rounded-full border border-destructive/40 bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors touch-manipulation active:scale-90"
                                  aria-label={`Delete ${track.title}`}
                                  title="Delete track"
                                >
                                  <Trash2 className="w-4 h-4 pointer-events-none" />
                                </button>
                              )}
                            </div>

                            {/* Track info */}
                            <div
                              className="flex-1 min-w-0"
                              onClick={() => playTrack(track)}
                            >
                              <p className="text-sm font-medium truncate">{track.title}</p>
                              {track.artist && (
                                <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </ScrollArea>

              {/* Upload button - only in tracks view */}
              {user && viewMode === 'tracks' && (
                <div className="px-3 py-2 border-t border-primary/20">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Music
                  </Button>
                </div>
              )}

              {/* Now playing & controls */}
              <div className="p-3 border-t border-primary/20 bg-muted/50">
                {/* Waveform visualizer with mode toggle */}
                {currentTrack && (
                  <div className="relative h-12 mb-3 rounded-lg bg-primary/5 border border-primary/10 p-2 overflow-hidden">
                    <AudioVisualizer
                      audioRef={audioRef}
                      isPlaying={isPlaying}
                      mode={visualizerMode}
                      barCount={24}
                      className="w-full h-full"
                    />
                    {/* Mode toggle button */}
                    <button
                      onClick={() => {
                        const modes: ('bars' | 'wave' | 'circular')[] = ['bars', 'wave', 'circular'];
                        const currentIndex = modes.indexOf(visualizerMode);
                        setVisualizerMode(modes[(currentIndex + 1) % modes.length]);
                      }}
                      className="absolute top-1 right-1 p-1 rounded bg-background/50 hover:bg-background/80 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title={`Mode: ${visualizerMode} (click to change)`}
                    >
                      {visualizerMode === 'bars' ? '▮▮▮' : visualizerMode === 'wave' ? '〜' : '◎'}
                    </button>
                  </div>
                )}

                {/* Progress bar */}
                {currentTrack && (
                  <div className="mb-2">
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="text-center mb-2">
                  <p className="text-sm font-medium truncate">
                    {currentTrack?.title || 'No track selected'}
                  </p>
                  {currentTrack?.artist && (
                    <p className="text-xs text-muted-foreground truncate">
                      {currentTrack.artist}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={playPrevious}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={displayedTracks.length === 0}
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={togglePlay}
                    className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                    disabled={displayedTracks.length === 0}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                  
                  <button
                    onClick={playNext}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={displayedTracks.length === 0}
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={toggleMute}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  
                  <div className="w-16">
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      max={100}
                      step={1}
                      onValueChange={([val]) => {
                        setVolume(val / 100);
                        if (isMuted) toggleMute();
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Dialog */}
      <MusicUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUpload={handleUploadWithCategory}
      />

      {/* Share Dialog */}
      <PlaylistShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        playlist={playlistToShare}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{trackToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTrackToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTrack}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
