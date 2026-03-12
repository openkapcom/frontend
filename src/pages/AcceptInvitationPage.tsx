import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Monitor,
  Loader2,
  AlertCircle,
  UserPlus,
  Users,
  Mail,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/authStore';
import { workspaceService } from '@/services/workspaceService';
import type { WorkspaceInvitation } from '@/types';

export default function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [invitation, setInvitation] = useState<WorkspaceInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchInvitation = async () => {
      try {
        setLoading(true);
        const data = await workspaceService.getInvitationByToken(token);
        setInvitation(data);
      } catch {
        setError('Invitation not found, expired, or already used.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    try {
      setAccepting(true);
      await workspaceService.acceptInvitation(token);
      setAccepted(true);
      setTimeout(() => {
        const slug = invitation?.workspace?.slug;
        navigate(slug ? `/workspaces/${slug}` : '/videos', { replace: true });
      }, 1500);
    } catch {
      setError('Failed to accept invitation. It may have expired or already been used.');
    } finally {
      setAccepting(false);
    }
  };

  const handleLoginRedirect = () => {
    localStorage.setItem('auth_redirect', window.location.pathname);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Monitor className="size-5" />
            <span className="text-lg font-bold tracking-tight">ScreenSense</span>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Invalid Invitation</AlertTitle>
            <AlertDescription>{error || 'Invitation not found.'}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/videos', { replace: true })}
          >
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
            <Check className="size-6" />
          </div>
          <p className="font-medium">Invitation accepted</p>
          <p className="text-sm text-muted-foreground">Redirecting to workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex items-center justify-center gap-2">
            <Monitor className="size-5" />
            <span className="text-lg font-bold tracking-tight">ScreenSense</span>
          </div>
          <UserPlus className="mx-auto size-8 text-muted-foreground" />
          <CardTitle>Workspace Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {invitation.workspace?.name || 'Workspace'}
                </p>
                <p className="text-xs text-muted-foreground">Workspace</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {invitation.inviter?.name || 'Team member'}
                </p>
                <p className="text-xs text-muted-foreground">Invited you</p>
              </div>
            </div>
          </div>

          {isAuthenticated ? (
            <Button
              className="w-full gap-2"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              Accept Invitation
            </Button>
          ) : (
            <Button className="w-full" onClick={handleLoginRedirect}>
              Login to accept
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
