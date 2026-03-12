import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Download, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { screenshotService } from '@/services/screenshotService';
import { API_BASE_URL } from '@/config/api';
import type { Screenshot } from '@/types';

export default function SharedScreenshotPage() {
  const { token } = useParams<{ token: string }>();
  const [screenshot, setScreenshot] = useState<Screenshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchScreenshot = async () => {
      try {
        setLoading(true);
        const data = await screenshotService.getSharedScreenshot(token);
        setScreenshot(data);
      } catch {
        setError('Screenshot not found or sharing link has expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchScreenshot();
  }, [token]);

  const imageUrl = token ? `${API_BASE_URL}/api/share/screenshot/${token}/image` : '';

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = screenshot?.title || 'screenshot';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
            <img src="/logo.svg" alt="OpenKap" className="size-6 rounded" />
            <span className="font-bold tracking-tight">OpenKap</span>
          </div>
        </header>
        <div className="mx-auto flex max-w-4xl items-center justify-center p-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !screenshot) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
            <img src="/logo.svg" alt="OpenKap" className="size-6 rounded" />
            <span className="font-bold tracking-tight">OpenKap</span>
          </div>
        </header>
        <div className="mx-auto max-w-md p-8">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'Screenshot not found.'}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="OpenKap" className="size-6 rounded" />
            <span className="font-bold tracking-tight">OpenKap</span>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
            <Download className="size-3.5" />
            Download
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 p-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{screenshot.title}</h1>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="size-3.5" />
            {formatDistanceToNow(new Date(screenshot.created_at), { addSuffix: true })}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <img
            src={imageUrl}
            alt={screenshot.title}
            className="w-full"
            onError={(e) => {
              (e.target as HTMLImageElement).alt = 'Failed to load screenshot';
            }}
          />
        </div>
      </main>
    </div>
  );
}
