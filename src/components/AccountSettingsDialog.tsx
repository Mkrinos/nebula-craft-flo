import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, CheckCircle, AlertTriangle, Trash2, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiInput } from '@/components/ui/sci-fi-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const emailSchema = z.string().email('Please enter a valid email');

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountSettingsDialog = ({ open, onOpenChange }: AccountSettingsDialogProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailResult = emailSchema.safeParse(newEmail);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }

    if (newEmail === user?.email) {
      toast.error('New email must be different from current email');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      }, {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setEmailSent(true);
        toast.success('Confirmation email sent! Check both your old and new email.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type DELETE MY ACCOUNT to confirm');
      return;
    }

    setDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { confirmation: deleteConfirmText },
      });

      if (error) {
        toast.error(error.message || 'Failed to delete account');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Your account has been deleted. Goodbye!');
      await signOut();
      navigate('/');
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('export-user-data');

      if (error) {
        toast.error(error.message || 'Failed to export data');
        return;
      }

      // Create and download the JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-touch-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Your data has been exported successfully!');
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    setNewEmail('');
    setEmailSent(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-space-dark/95 backdrop-blur-xl border-neon-cyan/30 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <SciFiFrame glowIntensity="subtle" animated={false} className="p-6">
            {/* Touch-safe close button inside the frame (prevents overlay/clip-path hitbox issues) */}
            <DialogClose
              data-no-swipe
              className="absolute right-3 top-3 z-50 rounded-sm opacity-80 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogClose>

            <DialogHeader className="mb-6">
              <DialogTitle className="font-display text-xl text-foreground">
                Account Settings
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Manage your account email and security settings
              </DialogDescription>
            </DialogHeader>

            {/* Current Email Display */}
            <div className="mb-6 p-3 rounded-sm bg-space-elevated/50 border border-neon-cyan/20">
              <p className="text-xs text-muted-foreground mb-1">Current Email</p>
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
            </div>

            {emailSent ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-neon-cyan/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-neon-cyan" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Confirmation Sent!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent confirmation links to both <span className="text-neon-cyan">{user?.email}</span> and <span className="text-neon-cyan">{newEmail}</span>
                  </p>
                  <div className="flex items-start gap-2 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200 text-left">
                      You must click the link in <strong>both</strong> emails to complete the change.
                    </p>
                  </div>
                </div>
                <SciFiButton
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="mt-4"
                >
                  Close
                </SciFiButton>
              </motion.div>
            ) : (
              <>
                <form onSubmit={handleEmailChange} className="space-y-4">
                  <SciFiInput
                    type="email"
                    label="New Email Address"
                    placeholder="Enter new email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                    required
                  />

                  <div className="flex items-start gap-2 p-3 bg-neon-cyan/5 border border-neon-cyan/20 rounded-sm">
                    <Lock className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      For security, we'll send confirmation links to both your current and new email addresses.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <SciFiButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={handleClose}
                    >
                      Cancel
                    </SciFiButton>
                    <SciFiButton
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="flex-1 group"
                      disabled={loading || !newEmail}
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <>
                          Update Email
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </SciFiButton>
                  </div>
                </form>

                {/* Data Export Section */}
                <div className="mt-8 pt-6 border-t border-neon-cyan/20">
                  <h4 className="text-sm font-display text-neon-cyan mb-2">Your Data</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Download a copy of all your data for GDPR compliance. This includes your images, settings, progress, and all other account data.
                  </p>
                  <SciFiButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                    onClick={handleExportData}
                    disabled={exporting}
                  >
                    {exporting ? (
                      <div className="w-4 h-4 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export My Data
                      </>
                    )}
                  </SciFiButton>
                </div>

                {/* Danger Zone */}
                <div className="mt-6 pt-6 border-t border-destructive/30">
                  <h4 className="text-sm font-display text-destructive mb-2">Danger Zone</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <SciFiButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </SciFiButton>
                </div>
              </>
            )}
          </SciFiFrame>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-space-dark/95 backdrop-blur-xl border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Your Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action <strong className="text-foreground">cannot be undone</strong>. This will permanently delete your account and remove all your data including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>All generated images</li>
                <li>Your personas and progress</li>
                <li>Achievements and credits</li>
                <li>Playlists and favorites</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-sm">
              <p className="text-xs text-muted-foreground mb-2">
                Type <span className="font-mono text-destructive font-bold">DELETE MY ACCOUNT</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="w-full px-3 py-2 bg-background/50 border border-destructive/30 rounded-sm text-sm font-mono focus:outline-none focus:ring-2 focus:ring-destructive/50"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-transparent border-neon-cyan/30 hover:bg-neon-cyan/10"
              onClick={() => {
                setDeleteConfirmText('');
                setShowDeleteConfirm(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <SciFiButton
              variant="ghost"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirmText !== 'DELETE MY ACCOUNT'}
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Forever
                </>
              )}
            </SciFiButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AccountSettingsDialog;
