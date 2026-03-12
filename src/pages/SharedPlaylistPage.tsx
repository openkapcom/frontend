import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Hls from 'hls.js';
import { formatDistanceToNow } from 'date-fns';
import {
  Lock,
  Loader2,
  AlertCircle,
  ListVideo,
  Play,
  Eye,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { playlistService } from '@/services/playlistService';
import { videoService } from '@/services/videoService';
import type { Playlist, Video } from '@/types';

export default function SharedPlaylistPage() {
  const { token } = useParams<{ token: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  const fetchPlaylist = useCallback(
    async (pw?: string) => {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);
        setPasswordError(false);
        const data = await playlistService.getSharedPlaylist(token, pw);
        setPlaylist(data);
        setNeedsPassword(false);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) {
          setNeedsPassword(true);
          if (pw) setPasswordError(true);
        } else {
          setError('Playlist not found or sharing link has expired.');
        }
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      fetchPlaylist(password.trim());
    }
  };

  const playVideo = useCallback(
    (video: Video) => {
      setActiveVideo(video);

      // Clean up previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Defer setup to next tick so the video element is rendered
      setTimeout(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        if (video.share_token) {
          const hlsUrl = videoService.getSharedHlsUrl(video.share_token);
          const streamUrl = videoService.getSharedStreamUrl(video.share_token);

          if (video.hls_ready && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(hlsUrl);
            hls.attachMedia(videoEl);
            hlsRef.current = hls;
            hls.on(Hls.Events.MANIFEST_PARSED, () => videoEl.play());
          } else if (video.hls_ready && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            videoEl.src = hlsUrl;
            videoEl.play();
          } else {
            videoEl.src = streamUrl;
            videoEl.play();
          }
        } else {
          // Fallback: use authenticated stream
          const hlsUrl = videoService.getHlsUrl(video.id);
          const streamUrl = videoService.getStreamUrl(video.id);

          if (video.hls_ready && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(hlsUrl);
            hls.attachMedia(videoEl);
            hlsRef.current = hls;
            hls.on(Hls.Events.MANIFEST_PARSED, () => videoEl.play());
          } else {
            videoEl.src = video.hls_ready ? hlsUrl : streamUrl;
            videoEl.play();
          }
        }
      }, 0);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  if (loading && !needsPassword) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
            <img src="/logo.svg" alt="OpenKap" className="size-6 rounded" />
            <span className="font-bold tracking-tight">OpenKap</span>
          </div>
        </header>
        <div className="mx-auto max-w-4xl space-y-4 p-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex items-center justify-center gap-2">
              <img src="/logo.svg" alt="OpenKap" className="size-6 rounded" />
              <span className="text-lg font-bold tracking-tight">OpenKap</span>
            </div>
            <Lock className="mx-auto size-8 text-muted-foreground" />
            <CardTitle>Password Required</CardTitle>
            <CardDescription>
              This playlist is password-protected. Enter the password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-destructive">Incorrect password. Please try again.</p>
              )}
              <Button type="submit" className="w-full" disabled={loading || !password.trim()}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Unlock'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !playlist) {
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
            <AlertDescription>{error || 'Playlist not found.'}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const videos = playlist.videos || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
          <img src="/logo.svg" alt="OpenKap" className="size-6 rounded" />
          <span className="font-bold tracking-tight">OpenKap</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-4">
        {/* Playlist info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ListVideo className="size-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold">{playlist.name}</h1>
          </div>
          {playlist.description && (
            <p className="text-sm text-muted-foreground">{playlist.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </p>
        </div>

        {/* Video Player (shown when a video is selected) */}
        {activeVideo && (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-lg border bg-black">
              <video
                ref={videoRef}
                className="aspect-video w-full"
                controls
                playsInline
              />
            </div>
            <h2 className="font-medium">{activeVideo.title}</h2>
            {activeVideo.description && (
              <p className="text-sm text-muted-foreground">{activeVideo.description}</p>
            )}
            <Separator />
          </div>
        )}

        {/* Video list */}
        {videos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            This playlist has no videos.
          </p>
        ) : (
          <div className="space-y-2">
            {videos.map((video, index) => {
              const isActive = activeVideo?.id === video.id;
              return (
                <button
                  key={video.id}
                  onClick={() => playVideo(video)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                    isActive ? 'border-foreground/20 bg-muted/50' : ''
                  }`}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded text-sm text-muted-foreground">
                    {isActive ? (
                      <Play className="size-4 fill-current" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{video.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3" />
                        {video.views_count}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {video.duration > 0 && (
                    <Badge variant="secondary" className="shrink-0">
                      {Math.floor(video.duration / 60)}:
                      {String(Math.floor(video.duration % 60)).padStart(2, '0')}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
