import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParentalControls } from '@/hooks/useParentalControls';
import Navigation from '@/components/Navigation';
import { SciFiPanel } from '@/components/ui/sci-fi-panel';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiBadge } from '@/components/ui/sci-fi-badge';
import { SciFiInput } from '@/components/ui/sci-fi-input';
import { SciFiDivider } from '@/components/ui/sci-fi-divider';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  Users, 
  Clock, 
  Activity, 
  Filter, 
  Link2, 
  Unlink, 
  Eye, 
  MessageSquare,
  Image,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { BackButton } from '@/components/BackButton';

const ParentalControls = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    controls,
    childProfiles,
    activities,
    usageData,
    loading,
    linkChild,
    unlinkChild,
    updateControls,
    fetchActivities,
    fetchUsageData
  } = useParentalControls();

  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);

  const handleLinkChild = async () => {
    if (!linkEmail.trim()) return;
    
    setIsLinking(true);
    const result = await linkChild(linkEmail.trim());
    setIsLinking(false);
    
    if (result.success) {
      setLinkEmail('');
      setShowLinkForm(false);
    }
  };

  const handleSelectChild = async (childId: string) => {
    setSelectedChild(childId);
    await Promise.all([
      fetchActivities(childId),
      fetchUsageData(childId)
    ]);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'generation': return <Image className="h-4 w-4 text-primary" />;
      case 'comment': return <MessageSquare className="h-4 w-4 text-accent" />;
      case 'view': return <Eye className="h-4 w-4 text-secondary" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getFilterLevelColor = (level: string) => {
    switch (level) {
      case 'strict': return 'success';
      case 'moderate': return 'warning';
      case 'minimal': return 'danger';
      default: return 'secondary';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <SciFiPanel variant="default" className="p-8 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold mb-2">Parental Controls</h1>
            <p className="text-muted-foreground">Please sign in to access parental controls.</p>
          </SciFiPanel>
        </div>
      </div>
    );
  }

  const selectedControl = controls.find(c => c.child_user_id === selectedChild);
  const selectedProfile = selectedChild ? childProfiles[selectedChild] : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Parental Controls</h1>
              <p className="text-muted-foreground">Monitor activity, set limits, and manage content filters</p>
            </div>
          </div>
          
          <SciFiButton
            variant="primary"
            onClick={() => setShowLinkForm(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Link Child Account
          </SciFiButton>
        </div>

        {/* Link Child Form */}
        <AnimatePresence>
          {showLinkForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <SciFiPanel variant="floating" className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  Link a Child Account
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your child's display name to link their account to your parental controls.
                </p>
                <div className="flex gap-4">
                  <SciFiInput
                    type="text"
                    placeholder="Child's display name"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    className="flex-1"
                  />
                  <SciFiButton
                    variant="primary"
                    onClick={handleLinkChild}
                    disabled={isLinking || !linkEmail.trim()}
                  >
                    {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Link Account'}
                  </SciFiButton>
                  <SciFiButton
                    variant="ghost"
                    onClick={() => {
                      setShowLinkForm(false);
                      setLinkEmail('');
                    }}
                  >
                    Cancel
                  </SciFiButton>
                </div>
              </SciFiPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {controls.length === 0 ? (
          <SciFiPanel variant="default" className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Linked Accounts</h2>
            <p className="text-muted-foreground mb-6">
              Link your child's account to start monitoring their activity and setting controls.
            </p>
            <SciFiButton
              variant="primary"
              onClick={() => setShowLinkForm(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Link First Child Account
            </SciFiButton>
          </SciFiPanel>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Child List Sidebar */}
            <div className="lg:col-span-1">
              <SciFiPanel variant="default" className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Linked Children
                </h3>
                <div className="space-y-2">
                  {controls.map(control => {
                    const profile = childProfiles[control.child_user_id];
                    const isSelected = selectedChild === control.child_user_id;
                    
                    return (
                      <button
                        key={control.id}
                        onClick={() => handleSelectChild(control.child_user_id)}
                        className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                          isSelected
                            ? 'bg-primary/20 border border-primary/40'
                            : 'bg-card/50 hover:bg-card border border-transparent'
                        }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {profile?.display_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">
                            {profile?.display_name || 'Unknown'}
                          </p>
                        </div>
                        <SciFiBadge 
                          variant={getFilterLevelColor(control.content_filter_level) as any}
                          size="sm"
                        >
                          {control.content_filter_level}
                        </SciFiBadge>
                      </button>
                    );
                  })}
                </div>
              </SciFiPanel>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {selectedChild && selectedControl ? (
                <Tabs defaultValue="activity" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <TabsList className="bg-card/50 border border-border/50">
                      <TabsTrigger value="activity" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Activity
                      </TabsTrigger>
                      <TabsTrigger value="limits" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Usage Limits
                      </TabsTrigger>
                      <TabsTrigger value="filters" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Content Filters
                      </TabsTrigger>
                    </TabsList>

                    <SciFiButton
                      variant="ghost"
                      size="sm"
                      onClick={() => unlinkChild(selectedChild)}
                      className="text-destructive hover:text-destructive gap-2"
                    >
                      <Unlink className="h-4 w-4" />
                      Unlink
                    </SciFiButton>
                  </div>

                  {/* Activity Tab */}
                  <TabsContent value="activity" className="space-y-6">
                    {/* Usage Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SciFiPanel variant="floating" className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/20">
                            <Image className="h-5 w-5 text-primary" />
                          </div>
                          <span className="text-sm text-muted-foreground">Today's Generations</span>
                        </div>
                        <p className="text-2xl font-bold">
                          {usageData.find(u => u.usage_date === format(new Date(), 'yyyy-MM-dd'))?.generations_count || 0}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{selectedControl.daily_generation_limit}
                          </span>
                        </p>
                      </SciFiPanel>

                      <SciFiPanel variant="floating" className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-accent/20">
                            <Clock className="h-5 w-5 text-accent" />
                          </div>
                          <span className="text-sm text-muted-foreground">Time Spent Today</span>
                        </div>
                        <p className="text-2xl font-bold">
                          {usageData.find(u => u.usage_date === format(new Date(), 'yyyy-MM-dd'))?.time_spent_minutes || 0}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{selectedControl.daily_time_limit_minutes} min
                          </span>
                        </p>
                      </SciFiPanel>

                      <SciFiPanel variant="floating" className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-secondary/20">
                            <TrendingUp className="h-5 w-5 text-secondary" />
                          </div>
                          <span className="text-sm text-muted-foreground">7-Day Average</span>
                        </div>
                        <p className="text-2xl font-bold">
                          {Math.round(usageData.slice(0, 7).reduce((acc, u) => acc + u.generations_count, 0) / 7)}
                          <span className="text-sm font-normal text-muted-foreground"> gen/day</span>
                        </p>
                      </SciFiPanel>
                    </div>

                    {/* Activity Log */}
                    <SciFiPanel variant="default" className="p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Recent Activity
                      </h3>
                      
                      {activities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No activity recorded yet</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-3">
                            {activities.map(activity => (
                              <div
                                key={activity.id}
                                className="flex items-start gap-3 p-3 rounded-lg bg-card/50"
                              >
                                <div className="p-2 rounded-lg bg-muted">
                                  {getActivityIcon(activity.activity_type)}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm capitalize">
                                    {activity.activity_type}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(parseISO(activity.created_at), 'MMM d, yyyy h:mm a')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </SciFiPanel>
                  </TabsContent>

                  {/* Usage Limits Tab */}
                  <TabsContent value="limits" className="space-y-6">
                    <SciFiPanel variant="default" className="p-6 space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">Daily Generation Limit</h4>
                            <p className="text-sm text-muted-foreground">
                              Maximum images per day
                            </p>
                          </div>
                          <span className="text-2xl font-bold text-primary">
                            {selectedControl.daily_generation_limit}
                          </span>
                        </div>
                        <Slider
                          value={[selectedControl.daily_generation_limit]}
                          onValueCommit={(value) => 
                            updateControls(selectedChild, { daily_generation_limit: value[0] })
                          }
                          min={5}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>5</span>
                          <span>100</span>
                        </div>
                      </div>

                      <SciFiDivider />

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">Daily Time Limit</h4>
                            <p className="text-sm text-muted-foreground">
                              Maximum minutes per day
                            </p>
                          </div>
                          <span className="text-2xl font-bold text-accent">
                            {selectedControl.daily_time_limit_minutes} min
                          </span>
                        </div>
                        <Slider
                          value={[selectedControl.daily_time_limit_minutes]}
                          onValueCommit={(value) => 
                            updateControls(selectedChild, { daily_time_limit_minutes: value[0] })
                          }
                          min={15}
                          max={180}
                          step={15}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>15 min</span>
                          <span>3 hours</span>
                        </div>
                      </div>
                    </SciFiPanel>
                  </TabsContent>

                  {/* Content Filters Tab */}
                  <TabsContent value="filters" className="space-y-6">
                    <SciFiPanel variant="default" className="p-6 space-y-6">
                      {/* Filter Level */}
                      <div>
                        <h4 className="font-semibold mb-4">Content Filter Level</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {['strict', 'moderate', 'minimal'].map(level => (
                            <button
                              key={level}
                              onClick={() => updateControls(selectedChild, { content_filter_level: level })}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                selectedControl.content_filter_level === level
                                  ? level === 'strict'
                                    ? 'border-green-500 bg-green-500/10'
                                    : level === 'moderate'
                                    ? 'border-yellow-500 bg-yellow-500/10'
                                    : 'border-red-500 bg-red-500/10'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {level === 'strict' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                {level === 'moderate' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                                {level === 'minimal' && <XCircle className="h-5 w-5 text-red-500" />}
                                <span className="font-semibold capitalize">{level}</span>
                              </div>
                              <p className="text-xs text-muted-foreground text-left">
                                {level === 'strict' && 'Strongest protection. Only approved content.'}
                                {level === 'moderate' && 'Balanced filtering with more flexibility.'}
                                {level === 'minimal' && 'Basic safety checks only.'}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <SciFiDivider />

                      {/* Community Permissions */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Community Permissions</h4>
                        
                        <div className="flex items-center justify-between p-4 rounded-lg bg-card/50">
                          <div className="flex items-center gap-3">
                            <Eye className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">View Community Gallery</p>
                              <p className="text-sm text-muted-foreground">
                                Can browse other users' public creations
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={selectedControl.allow_community_viewing}
                            onCheckedChange={(checked) => 
                              updateControls(selectedChild, { allow_community_viewing: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-card/50">
                          <div className="flex items-center gap-3">
                            <Image className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Post to Community</p>
                              <p className="text-sm text-muted-foreground">
                                Can share their creations publicly
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={selectedControl.allow_community_posting}
                            onCheckedChange={(checked) => 
                              updateControls(selectedChild, { allow_community_posting: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-card/50">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Comment on Posts</p>
                              <p className="text-sm text-muted-foreground">
                                Can leave comments on community posts
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={selectedControl.allow_comments}
                            onCheckedChange={(checked) => 
                              updateControls(selectedChild, { allow_comments: checked })
                            }
                          />
                        </div>
                      </div>
                    </SciFiPanel>
                  </TabsContent>
                </Tabs>
              ) : (
                <SciFiPanel variant="default" className="p-12 text-center">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-xl font-semibold mb-2">Select a Child</h2>
                  <p className="text-muted-foreground">
                    Choose a linked child account from the sidebar to view their activity and manage controls.
                  </p>
                </SciFiPanel>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ParentalControls;
