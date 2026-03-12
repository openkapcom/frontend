import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Hls from 'hls.js';
import { formatDistanceToNow } from 'date-fns';
import {
  Monitor,
  Eye,
  Calendar,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Send,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { videoService } from '@/services/videoService';
import type { Video, Comment } from '@/types';

export default function SharedVideoPage() {
  const { token } = useParams<{ token: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<{ emoji: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAuthenticated = !!localStorage.getItem('auth_token');

  const loadVideo = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [videoData, commentsData] = await Promise.all([
        videoService.getSharedVideo(token),
        videoService.getSharedComments(token),
      ]);
      setVideo(videoData);
      setComments(commentsData);

      // Record view
      videoService.recordSharedView(token).catch(() => {});

      // Load reactions (non-critical)
      try {
        if (videoData.id) {
          const reactionsData = await videoService.getReactions(videoData.id);
          setReactions(reactionsData);
        }
      } catch {
        // reactions are optional
      }
    } catch {
      setError('Video not found or sharing link has expired.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  useEffect(() => {
    if (!video || !videoRef.current || !token) return;

    const videoEl = videoRef.current;
    const hlsUrl = videoService.getSharedHlsUrl(token);
    const streamUrl = videoService.getSharedStreamUrl(token);

    if (video.hls_ready && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoEl);
      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.hls_ready && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = hlsUrl;
    } else {
      videoEl.src = streamUrl;
    }
  }, [video, token]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddComment = async () => {
    if (!token || !commentBody.trim()) return;
    try {
      setSubmitting(true);
      const newComment = await videoService.addSharedComment(token, commentBody.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentBody('');
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
            <Monitor className="size-5" />
            <span className="font-bold tracking-tight">ScreenSense</span>
          </div>
        </header>
        <div className="mx-auto max-w-4xl space-y-4 p-4">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
            <Monitor className="size-5" />
            <span className="font-bold tracking-tight">ScreenSense</span>
          </div>
        </header>
        <div className="mx-auto max-w-md p-8">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'Video not found.'}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const captionsUrl = token ? videoService.getSharedCaptionsUrl(token) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Monitor className="size-5" />
            <span className="font-bold tracking-tight">ScreenSense</span>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyLink}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : 'Share'}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-4">
        {/* Video Player */}
        <div className="overflow-hidden rounded-lg border bg-black">
          <video
            ref={videoRef}
            className="aspect-video w-full"
            controls
            playsInline
            crossOrigin="anonymous"
          >
            {captionsUrl && (
              <track kind="captions" src={captionsUrl} srcLang="en" label="English" />
            )}
          </video>
        </div>

        {/* Video Info */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">{video.title}</h1>
          {video.description && (
            <p className="text-sm text-muted-foreground">{video.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" />
              {video.views_count} {video.views_count === 1 ? 'view' : 'views'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" />
              {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {reactions.map((r) => (
              <Badge key={r.emoji} variant="secondary">
                {r.emoji} {r.count}
              </Badge>
            ))}
          </div>
        )}

        <Separator />

        {/* Comments */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4" />
            <h2 className="font-medium">
              Comments ({comments.length})
            </h2>
          </div>

          {isAuthenticated && (
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                className="min-h-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleAddComment}
                disabled={!commentBody.trim() || submitting}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          )}

          {comments.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No comments yet.
            </p>
          )}

          <div className="space-y-3">
            {comments.map((comment) => (
              <Card key={comment.id} size="sm">
                <CardContent className="flex gap-3">
                  <Avatar size="sm">
                    {comment.user?.avatar && <AvatarImage src={comment.user.avatar} />}
                    <AvatarFallback>
                      {comment.user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.user?.name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {comment.timestamp !== undefined && comment.timestamp !== null && (
                        <Badge variant="outline" className="text-xs">
                          {Math.floor(comment.timestamp / 60)}:
                          {String(Math.floor(comment.timestamp % 60)).padStart(2, '0')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
