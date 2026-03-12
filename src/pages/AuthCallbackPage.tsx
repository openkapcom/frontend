import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Monitor } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const hash = window.location.hash.substring(1);
      if (!hash) {
        setError('No authentication data received.');
        return;
      }

      const params = new URLSearchParams(hash);
      const token = params.get('token');
      const userStr = params.get('user');

      if (!token || !userStr) {
        setError('Invalid authentication response. Missing token or user data.');
        return;
      }

      let user: User;
      try {
        user = JSON.parse(decodeURIComponent(userStr));
      } catch {
        setError('Failed to parse user data.');
        return;
      }

      setAuth(token, user);

      const redirectPath = localStorage.getItem('auth_redirect') || '/videos';
      localStorage.removeItem('auth_redirect');
      navigate(redirectPath, { replace: true });
    } catch {
      setError('An unexpected error occurred during authentication.');
    }
  }, [setAuth, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Monitor className="size-5" />
            <span className="text-lg font-bold tracking-tight">ScreenSense</span>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Authentication failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/login', { replace: true })}
          >
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
