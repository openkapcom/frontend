import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Trash2,
  Share2,
  Lock,
  Copy,
  Check,
  ListVideo,
  ArrowUpDown,
  Pencil,
  Video as VideoIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { playlistService } from '@/services/playlistService';
import { videoService } from '@/services/videoService';
import type { Playlist, Video } from '@/types';

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const playlistId = Number(id);

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('default');

  // Editable fields
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');

  // Share
  const [copied, setCopied] = useState(false);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  // Add video dialog
  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<number[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const fetchPlaylist = useCallback(async () => {
    try {
      setLoading(true);
      const data = await playlistService.getPlaylist(playlistId);
      setPlaylist(data);
      setNameValue(data.name);
      setDescValue(data.description || '');
      setPasswordEnabled(data.has_password);
    } catch {
      toast.error('Failed to load playlist');
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  const videos = playlist?.videos || [];

  const sortedVideos = [...videos].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default:
        return 0;
    }
  });

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    try {
      const updated = await playlistService.updatePlaylist(playlistId, { name: nameValue });
      setPlaylist(updated);
      setEditingName(false);
      toast.success('Name updated');
    } catch {
      toast.error('Failed to update name');
    }
  };

  const handleSaveDesc = async () => {
    try {
      const updated = await playlistService.updatePlaylist(playlistId, {
        description: descValue,
      });
      setPlaylist(updated);
      setEditingDesc(false);
      toast.success('Description updated');
    } catch {
      toast.error('Failed to update description');
    }
  };

  const handleToggleSharing = async () => {
    if (!playlist) return;
    try {
      const updated = await playlistService.toggleSharing(playlistId);
      setPlaylist(updated);
      toast.success(updated.is_shared ? 'Sharing enabled' : 'Sharing disabled');
    } catch {
      toast.error('Failed to toggle sharing');
    }
  };

  const handleSetPassword = async () => {
    try {
      await playlistService.setPassword(
        playlistId,
        passwordEnabled ? passwordValue || null : null,
      );
      if (playlist) {
        setPlaylist({ ...playlist, has_password: passwordEnabled && !!passwordValue });
      }
      toast.success('Password updated');
    } catch {
      toast.error('Failed to set password');
    }
  };

  const handleCopyShareLink = () => {
    if (!playlist?.share_token) return;
    const url = `${window.location.origin}/share/playlist/${playlist.share_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveVideo = async (videoId: number) => {
    try {
      await playlistService.removeVideo(playlistId, videoId);
      setPlaylist((prev) =>
        prev
          ? {
              ...prev,
              videos: prev.videos?.filter((v) => v.id !== videoId),
              videos_count: prev.videos_count - 1,
            }
          : prev,
      );
      toast.success('Video removed');
    } catch {
      toast.error('Failed to remove video');
    }
  };

  const handleMoveVideo = async (index: number, direction: 'up' | 'down') => {
    if (!playlist?.videos) return;
    const newVideos = [...playlist.videos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newVideos.length) return;
    [newVideos[index], newVideos[targetIndex]] = [newVideos[targetIndex], newVideos[index]];
    setPlaylist({ ...playlist, videos: newVideos });
    try {
      await playlistService.reorderVideos(
        playlistId,
        newVideos.map((v) => v.id),
      );
    } catch {
      toast.error('Failed to reorder');
      fetchPlaylist();
    }
  };

  const openAddVideo = async () => {
    setAddVideoOpen(true);
    setSelectedVideoIds([]);
    try {
      setLoadingVideos(true);
      const data = await videoService.getVideos();
      const existingIds = new Set(videos.map((v) => v.id));
      setAllVideos(data.filter((v) => !existingIds.has(v.id)));
    } catch {
      toast.error('Failed to load videos');
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleAddVideos = async () => {
    if (selectedVideoIds.length === 0) return;
    try {
      await playlistService.bulkAddVideos(playlistId, selectedVideoIds);
      setAddVideoOpen(false);
      fetchPlaylist();
      toast.success('Videos added');
    } catch {
      toast.error('Failed to add videos');
    }
  };

  const toggleVideoSelection = (videoId: number) => {
    setSelectedVideoIds((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId],
    );
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <p className="text-muted-foreground">Playlist not found</p>
        <Link to="/playlists">
          <Button className="mt-4" variant="outline">Back to Playlists</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back link */}
      <Link
        to="/playlists"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 size-4" />
        Back to Playlists
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="text-xl font-bold"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <Button size="sm" onClick={handleSaveName}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingName(false);
                  setNameValue(playlist.name);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{playlist.name}</h1>
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => setEditingName(true)}
              >
                <Pencil className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {editingDesc ? (
          <div className="flex items-start gap-2">
            <Textarea
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              rows={2}
              className="max-w-lg"
            />
            <Button size="sm" onClick={handleSaveDesc}>
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingDesc(false);
                setDescValue(playlist.description || '');
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {playlist.description || 'No description'}
            </p>
            <Button
              size="icon"
              variant="ghost"
              className="size-6"
              onClick={() => setEditingDesc(true)}
            >
              <Pencil className="size-3" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {playlist.videos_count} {playlist.videos_count === 1 ? 'video' : 'videos'}
          </Badge>
          {playlist.is_shared && <Badge>Shared</Badge>}
          {playlist.has_password && (
            <Badge variant="outline">
              <Lock className="mr-1 size-3" />
              Protected
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Sharing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sharing</CardTitle>
          <CardDescription>Control who can access this playlist</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Share publicly</Label>
              <p className="text-xs text-muted-foreground">
                Anyone with the link can view this playlist
              </p>
            </div>
            <Switch checked={playlist.is_shared} onCheckedChange={handleToggleSharing} />
          </div>

          {playlist.is_shared && playlist.share_token && (
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/share/playlist/${playlist.share_token}`}
                className="text-xs"
              />
              <Button size="icon" variant="outline" onClick={handleCopyShareLink}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Password protection</Label>
                <p className="text-xs text-muted-foreground">
                  Require a password to view this playlist
                </p>
              </div>
              <Switch
                checked={passwordEnabled}
                onCheckedChange={setPasswordEnabled}
              />
            </div>
            {passwordEnabled && (
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder="Enter password"
                />
                <Button size="sm" onClick={handleSetPassword}>
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Videos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Videos</h2>
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={(val) => setSortBy(val || 'default')}>
              <SelectTrigger className="w-[150px]">
                <ArrowUpDown className="mr-2 size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Manual order</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openAddVideo}>
              <Plus className="mr-2 size-4" />
              Add Videos
            </Button>
          </div>
        </div>

        {sortedVideos.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12">
            <ListVideo className="mb-4 size-10 text-muted-foreground" />
            <h3 className="font-semibold">No videos in this playlist</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add videos to start building your playlist.
            </p>
            <Button className="mt-4" variant="outline" onClick={openAddVideo}>
              <Plus className="mr-2 size-4" />
              Add Videos
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {sortedVideos.map((video, index) => (
              <Card key={video.id} className="flex items-center gap-3 p-3">
                {sortBy === 'default' && (
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      disabled={index === 0}
                      onClick={() => handleMoveVideo(index, 'up')}
                    >
                      <GripVertical className="size-4 rotate-0" />
                    </Button>
                  </div>
                )}
                <div className="flex size-10 items-center justify-center rounded bg-muted text-sm font-medium text-muted-foreground">
                  {index + 1}
                </div>
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-10 w-16 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-16 items-center justify-center rounded bg-muted">
                    <VideoIcon className="size-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{video.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(video.duration)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveVideo(video.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Video Dialog */}
      <Dialog open={addVideoOpen} onOpenChange={setAddVideoOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Videos</DialogTitle>
            <DialogDescription>
              Select videos to add to this playlist.
            </DialogDescription>
          </DialogHeader>
          {loadingVideos ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : allVideos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No available videos to add.
            </p>
          ) : (
            <div className="space-y-2">
              {allVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted/50"
                  onClick={() => toggleVideoSelection(video.id)}
                >
                  <Checkbox
                    checked={selectedVideoIds.includes(video.id)}
                    onCheckedChange={() => toggleVideoSelection(video.id)}
                  />
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="h-8 w-14 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-14 items-center justify-center rounded bg-muted">
                      <VideoIcon className="size-3 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{video.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(video.duration)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddVideoOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVideos} disabled={selectedVideoIds.length === 0}>
              Add {selectedVideoIds.length > 0 && `(${selectedVideoIds.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
