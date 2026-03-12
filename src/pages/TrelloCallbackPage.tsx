import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { integrationService } from '@/services/integrationService';

export default function TrelloCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const token = params.get('token');

        if (!token) {
          setError('No token received from Trello.');
          setStatus('error');
          return;
        }

        await integrationService.handleTrelloCallback(token);
        setStatus('success');

        setTimeout(() => {
          navigate('/integrations', { replace: true });
        }, 2000);
      } catch {
        setError('Failed to connect Trello. Please try again.');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Monitor className="size-5" />
          <span className="text-lg font-bold tracking-tight">ScreenSense</span>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Connecting Trello...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
              <Check className="size-6" />
            </div>
            <p className="font-medium">Trello connected successfully</p>
            <p className="text-sm text-muted-foreground">Redirecting to integrations...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Connection failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/integrations', { replace: true })}
            >
              Go to integrations
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
