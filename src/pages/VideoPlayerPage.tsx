import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Hls from 'hls.js';
import { videoService } from '@/services/videoService';
import { integrationService } from '@/services/integrationService';
import { useAuthStore } from '@/stores/authStore';
import type { Video, Comment, ZoomEvent, Integration, IntegrationTarget } from '@/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  ArrowLeft,
  Copy,
  Check,
  Edit3,
  Download,
  Share2,
  MessageSquare,
  FileText,
  Brain,
  BarChart3,
  Clock,
  Eye,
  Users,
  Timer,
  HardDrive,
  Calendar,
  RefreshCw,
  Send,
  Trash2,
  Loader2,
  Zap,
  ExternalLink,
} from 'lucide-react';

// --- Helpers ---

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const REACTION_EMOJIS = ['👍', '👎', '❤️', '🔥', '👏', '😂', '😮', '🤔'];

// --- Main Component ---

export default function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const videoId = Number(id);

  // Data
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<{ emoji: string; count: number }[]>([]);
  const [stats, setStats] = useState<{ views: number; unique_viewers: number; avg_watch_time: number } | null>(null);
  const [zoomEvents, setZoomEvents] = useState<ZoomEvent[]>([]);
  const [transcription, setTranscription] = useState<{ text: string; status: string } | null>(null);
  const [summary, setSummary] = useState<{ text: string } | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  // UI
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comments');

  // Inline editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');

  // Comments
  const [commentBody, setCommentBody] = useState('');
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Transcription
  const [transcriptionText, setTranscriptionText] = useState('');
  const [transcriptionPolling, setTranscriptionPolling] = useState(false);
  const [savingTranscription, setSavingTranscription] = useState(false);

  // Summary
  const [requestingSummary, setRequestingSummary] = useState(false);

  // Share
  const [copied, setCopied] = useState(false);

  // Integration sharing
  const [shareProvider, setShareProvider] = useState('');
  const [shareTargets, setShareTargets] = useState<IntegrationTarget[]>([]);
  const [shareTargetId, setShareTargetId] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [sharingToIntegration, setSharingToIntegration] = useState(false);

  // Video player
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // --- Data Loading ---

  const loadVideo = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    try {
      const [v, cmts, rxns, sts, zEvents] = await Promise.all([
        videoService.getVideo(videoId),
        videoService.getComments(videoId),
        videoService.getReactions(videoId),
        videoService.getStats(videoId),
        videoService.getZoomEvents(videoId),
      ]);
      setVideo(v);
      setComments(cmts);
      setReactions(rxns);
      setStats(sts);
      setZoomEvents(zEvents);
      setTitleValue(v.title);
      setDescriptionValue(v.description || '');

      // Record view
      videoService.recordView(videoId).catch(() => {});

      // Load integrations
      integrationService.getIntegrations().then(setIntegrations).catch(() => {});
    } catch (err) {
      console.error('Failed to load video:', err);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  // --- HLS Setup ---

  useEffect(() => {
    if (!video || !videoRef.current) return;

    const videoEl = videoRef.current;

    if (video.hls_ready && video.hls_path) {
      const hlsUrl = videoService.getHlsUrl(video.id);

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });
        hls.loadSource(hlsUrl);
        hls.attachMedia(videoEl);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              // Fallback to direct stream
              videoEl.src = videoService.getStreamUrl(video.id);
            }
          }
        });
        hlsRef.current = hls;
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        videoEl.src = hlsUrl;
      } else {
        // Fallback to direct stream
        videoEl.src = videoService.getStreamUrl(video.id);
      }
    } else {
      videoEl.src = videoService.getStreamUrl(video.id);
    }

    const handleTimeUpdate = () => setCurrentTime(videoEl.currentTime);
    videoEl.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [video]);

  // --- Actions ---

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleSaveTitle = async () => {
    if (!video || !titleValue.trim()) return;
    try {
      const updated = await videoService.updateVideo(video.id, { title: titleValue.trim() });
      setVideo(updated);
      setEditingTitle(false);
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  const handleSaveDescription = async () => {
    if (!video) return;
    try {
      const updated = await videoService.updateVideo(video.id, { description: descriptionValue });
      setVideo(updated);
      setEditingDescription(false);
    } catch (err) {
      console.error('Failed to update description:', err);
    }
  };

  const handleAddComment = async () => {
    if (!video || !commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const ts = includeTimestamp ? Math.floor(currentTime) : undefined;
      const comment = await videoService.addComment(video.id, commentBody.trim(), ts);
      setComments((prev) => [comment, ...prev]);
      setCommentBody('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!video) return;
    try {
      await videoService.deleteComment(video.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!video) return;
    try {
      await videoService.addReaction(video.id, emoji);
      const updated = await videoService.getReactions(video.id);
      setReactions(updated);
    } catch (err) {
      console.error('Failed to add reaction:', err);
    }
  };

  const handleToggleSharing = async () => {
    if (!video) return;
    try {
      const updated = await videoService.toggleSharing(video.id);
      setVideo(updated);
    } catch (err) {
      console.error('Failed to toggle sharing:', err);
    }
  };

  const handleRegenerateToken = async () => {
    if (!video) return;
    try {
      const { share_token } = await videoService.regenerateToken(video.id);
      setVideo({ ...video, share_token });
    } catch (err) {
      console.error('Failed to regenerate token:', err);
    }
  };

  const handleCopyShareUrl = () => {
    if (!video?.share_token) return;
    const url = `${window.location.origin}/share/video/${video.share_token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRequestTranscription = async () => {
    if (!video) return;
    try {
      await videoService.requestTranscription(video.id);
      setTranscriptionPolling(true);
      pollTranscription();
    } catch (err) {
      console.error('Failed to request transcription:', err);
    }
  };

  const pollTranscription = useCallback(async () => {
    if (!videoId) return;
    const poll = async () => {
      try {
        const status = await videoService.getTranscriptionStatus(videoId);
        if (status.status === 'completed') {
          const t = await videoService.getTranscription(videoId);
          setTranscription(t);
          setTranscriptionText(t.text);
          setTranscriptionPolling(false);
          return;
        }
        if (status.status === 'failed') {
          setTranscriptionPolling(false);
          return;
        }
        setTimeout(poll, 3000);
      } catch {
        setTranscriptionPolling(false);
      }
    };
    poll();
  }, [videoId]);

  const handleSaveTranscription = async () => {
    if (!video) return;
    setSavingTranscription(true);
    try {
      await videoService.updateTranscription(video.id, transcriptionText);
      setTranscription({ text: transcriptionText, status: 'completed' });
    } catch (err) {
      console.error('Failed to save transcription:', err);
    } finally {
      setSavingTranscription(false);
    }
  };

  const handleRequestSummary = async () => {
    if (!video) return;
    setRequestingSummary(true);
    try {
      await videoService.requestSummary(video.id);
      // Poll or just fetch after delay
      const fetchSummary = async () => {
        try {
          const s = await videoService.getSummary(video.id);
          if (s.text) {
            setSummary(s);
            setRequestingSummary(false);
            return;
          }
          setTimeout(fetchSummary, 3000);
        } catch {
          setRequestingSummary(false);
        }
      };
      setTimeout(fetchSummary, 2000);
    } catch (err) {
      console.error('Failed to request summary:', err);
      setRequestingSummary(false);
    }
  };

  const handleDownloadMp4 = async () => {
    if (!video) return;
    try {
      const blob = await videoService.downloadMp4(video.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Try request download first
      try {
        await videoService.requestDownloadMp4(video.id);
        // Then try downloading again after a bit
        setTimeout(async () => {
          const blob = await videoService.downloadMp4(video.id);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${video.title}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1000);
      } catch (err) {
        console.error('Failed to download:', err);
      }
    }
  };

  // Load transcription on tab change
  useEffect(() => {
    if (activeTab === 'transcription' && !transcription && videoId) {
      videoService
        .getTranscription(videoId)
        .then((t) => {
          setTranscription(t);
          setTranscriptionText(t.text);
          if (t.status === 'processing') {
            setTranscriptionPolling(true);
            pollTranscription();
          }
        })
        .catch(() => {});
    }
    if (activeTab === 'summary' && !summary && videoId) {
      videoService
        .getSummary(videoId)
        .then(setSummary)
        .catch(() => {});
    }
  }, [activeTab, transcription, summary, videoId, pollTranscription]);

  // Load integration targets when provider selected
  useEffect(() => {
    if (shareProvider) {
      integrationService
        .getTargets(shareProvider)
        .then(setShareTargets)
        .catch(() => setShareTargets([]));
    } else {
      setShareTargets([]);
    }
  }, [shareProvider]);

  const handleShareToIntegration = async () => {
    if (!video || !shareProvider || !shareTargetId) return;
    setSharingToIntegration(true);
    try {
      await integrationService.shareVideo(shareProvider, video.id, shareTargetId, shareMessage || undefined);
      setShareProvider('');
      setShareTargetId('');
      setShareMessage('');
    } catch (err) {
      console.error('Failed to share to integration:', err);
    } finally {
      setSharingToIntegration(false);
    }
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-8 w-2/3 mt-4" />
              <Skeleton className="h-4 w-1/3 mt-2" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Video not found</h2>
          <p className="text-muted-foreground mt-1">The video you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => navigate('/videos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  const shareUrl = video.share_token
    ? `${window.location.origin}/share/video/${video.share_token}`
    : '';

  const connectedIntegrations = integrations.filter((i) => i.connected);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate('/videos')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Video Player + Tabs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full aspect-video"
                controls
                playsInline
              />
            </div>

            {/* Title */}
            <div>
              {editingTitle ? (
                <div className="flex gap-2 items-center">
                  <Input
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    className="text-xl font-bold"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') {
                        setEditingTitle(false);
                        setTitleValue(video.title);
                      }
                    }}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveTitle}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingTitle(false);
                      setTitleValue(video.title);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1
                    className="text-xl font-bold cursor-pointer hover:text-muted-foreground transition-colors"
                    onClick={() => setEditingTitle(true)}
                  >
                    {video.title}
                  </h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setEditingTitle(true)}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* Description */}
              {editingDescription ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDescription}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingDescription(false);
                        setDescriptionValue(video.description || '');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p
                  className="text-sm text-muted-foreground mt-1 cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => setEditingDescription(true)}
                >
                  {video.description || 'Click to add a description...'}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/video/${video.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit3 className="h-4 w-4 mr-1.5" />
                  Edit Video
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleDownloadMp4}>
                <Download className="h-4 w-4 mr-1.5" />
                Download MP4
              </Button>
            </div>

            {/* Reactions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {REACTION_EMOJIS.map((emoji) => {
                const reaction = reactions.find((r) => r.emoji === emoji);
                return (
                  <Button
                    key={emoji}
                    variant={reaction ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-8 text-sm"
                    onClick={() => handleReaction(emoji)}
                  >
                    <span className="mr-1">{emoji}</span>
                    {reaction ? reaction.count : 0}
                  </Button>
                );
              })}
            </div>

            {/* Zoom Events */}
            {zoomEvents.length > 0 && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Zoom Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="flex gap-2 flex-wrap">
                    {zoomEvents.map((event, i) => (
                      <Badge
                        key={event.id || i}
                        variant="secondary"
                        className="cursor-pointer hover:bg-muted-foreground/20"
                        onClick={() => seekTo(event.time)}
                      >
                        {formatTimestamp(event.time)} - {event.zoom_level}x
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="comments">
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  Comments
                  {comments.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px] h-5 px-1.5">
                      {comments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="transcription">
                  <FileText className="h-4 w-4 mr-1.5" />
                  Transcription
                </TabsTrigger>
                <TabsTrigger value="summary">
                  <Brain className="h-4 w-4 mr-1.5" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="stats">
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  Stats
                </TabsTrigger>
                <TabsTrigger value="share">
                  <Share2 className="h-4 w-4 mr-1.5" />
                  Share
                </TabsTrigger>
              </TabsList>

              {/* Comments Tab */}
              <TabsContent value="comments" className="space-y-4 mt-4">
                {/* Add Comment Form */}
                <div className="space-y-2">
                  <Textarea
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="timestamp"
                        checked={includeTimestamp}
                        onCheckedChange={setIncludeTimestamp}
                      />
                      <Label htmlFor="timestamp" className="text-sm text-muted-foreground">
                        Include timestamp ({formatTimestamp(currentTime)})
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!commentBody.trim() || submittingComment}
                    >
                      {submittingComment ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-1.5" />
                      )}
                      Comment
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Comments List */}
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">No comments yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={comment.user?.avatar} />
                          <AvatarFallback className="text-xs">
                            {comment.user ? getInitials(comment.user.name) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {comment.user?.name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.created_at)}
                            </span>
                            {comment.timestamp != null && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] cursor-pointer hover:bg-muted-foreground/20"
                                onClick={() => seekTo(comment.timestamp!)}
                              >
                                <Clock className="h-2.5 w-2.5 mr-1" />
                                {formatTimestamp(comment.timestamp)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mt-0.5">{comment.body}</p>
                        </div>
                        {user && comment.user_id === user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 shrink-0"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Transcription Tab */}
              <TabsContent value="transcription" className="space-y-4 mt-4">
                {transcriptionPolling ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Generating transcription...</p>
                    <p className="text-xs text-muted-foreground mt-1">This may take a few minutes.</p>
                  </div>
                ) : transcription && transcription.text ? (
                  <div className="space-y-3">
                    <Textarea
                      value={transcriptionText}
                      onChange={(e) => setTranscriptionText(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleSaveTranscription}
                        disabled={savingTranscription || transcriptionText === transcription.text}
                      >
                        {savingTranscription ? (
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-1.5" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">No transcription available.</p>
                    <Button className="mt-3" size="sm" onClick={handleRequestTranscription}>
                      <FileText className="h-4 w-4 mr-1.5" />
                      Generate Transcription
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-4 mt-4">
                {requestingSummary ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Generating AI summary...</p>
                  </div>
                ) : summary && summary.text ? (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{summary.text}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">No summary available.</p>
                    <Button className="mt-3" size="sm" onClick={handleRequestSummary}>
                      <Brain className="h-4 w-4 mr-1.5" />
                      Generate Summary
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="mt-4">
                {stats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Eye className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-2xl font-bold mt-2">{stats.views}</p>
                        <p className="text-sm text-muted-foreground">Total Views</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-2xl font-bold mt-2">{stats.unique_viewers}</p>
                        <p className="text-sm text-muted-foreground">Unique Viewers</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Timer className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-2xl font-bold mt-2">{formatDuration(stats.avg_watch_time)}</p>
                        <p className="text-sm text-muted-foreground">Avg. Watch Time</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">No stats available yet.</p>
                  </div>
                )}
              </TabsContent>

              {/* Share Tab */}
              <TabsContent value="share" className="space-y-6 mt-4">
                {/* Share Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Public Sharing</p>
                    <p className="text-xs text-muted-foreground">
                      Anyone with the link can view this video.
                    </p>
                  </div>
                  <Switch
                    checked={video.is_shared}
                    onCheckedChange={handleToggleSharing}
                  />
                </div>

                {video.is_shared && shareUrl && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm">Share URL</Label>
                      <div className="flex gap-2">
                        <Input value={shareUrl} readOnly className="font-mono text-xs" />
                        <Button variant="outline" size="sm" onClick={handleCopyShareUrl}>
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleRegenerateToken}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Integration Sharing */}
                    {connectedIntegrations.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <p className="font-medium text-sm">Share to Integration</p>
                          <Select value={shareProvider} onValueChange={(val) => setShareProvider(val || '')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select integration..." />
                            </SelectTrigger>
                            <SelectContent>
                              {connectedIntegrations.map((integration) => (
                                <SelectItem key={integration.provider} value={integration.provider}>
                                  {integration.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {shareProvider && shareTargets.length > 0 && (
                            <>
                              <Select value={shareTargetId} onValueChange={(val) => setShareTargetId(val || '')}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select target..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {shareTargets.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                      {t.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                value={shareMessage}
                                onChange={(e) => setShareMessage(e.target.value)}
                                placeholder="Optional message..."
                              />
                              <Button
                                size="sm"
                                onClick={handleShareToIntegration}
                                disabled={!shareTargetId || sharingToIntegration}
                              >
                                {sharingToIntegration ? (
                                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                ) : (
                                  <ExternalLink className="h-4 w-4 mr-1.5" />
                                )}
                                Share
                              </Button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Video Info Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Video Details</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Duration
                  </span>
                  <span className="font-mono">{formatDuration(video.duration)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <HardDrive className="h-4 w-4" />
                    Size
                  </span>
                  <span>{formatFileSize(video.size)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Uploaded
                  </span>
                  <span>{formatDate(video.created_at)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    Views
                  </span>
                  <span>{video.views_count}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <div className="flex gap-1.5">
                    <Badge variant={video.status === 'ready' ? 'default' : 'secondary'} className="text-[10px]">
                      {video.status}
                    </Badge>
                    {video.hls_ready && (
                      <Badge variant="outline" className="text-[10px]">
                        HLS
                      </Badge>
                    )}
                  </div>
                </div>
                {video.is_shared && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sharing</span>
                      <Badge variant="outline" className="text-[10px]">
                        <Share2 className="h-2.5 w-2.5 mr-1" />
                        Public
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Link to={`/video/${video.id}/edit`}>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Open in Editor
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                  onClick={handleDownloadMp4}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download MP4
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                  onClick={handleToggleSharing}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {video.is_shared ? 'Disable Sharing' : 'Enable Sharing'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
