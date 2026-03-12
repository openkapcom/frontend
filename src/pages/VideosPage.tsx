import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoService } from '@/services/videoService';
import { folderService } from '@/services/folderService';
import { screenshotService } from '@/services/screenshotService';
import { playlistService } from '@/services/playlistService';
import { useAuthStore } from '@/stores/authStore';
import type { Video, Folder, Screenshot, Playlist } from '@/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Search,
  Upload,
  FolderPlus,
  MoreVertical,
  Star,
  Share2,
  Trash2,
  Edit3,
  FolderIcon,
  ListMusic,
  Eye,
  Clock,
  ArrowUpDown,
  CheckSquare,
  X,
  Heart,
  ImageIcon,
  VideoIcon,
  FileVideo,
  Plus,
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
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatViews(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
  return `${count} view${count !== 1 ? 's' : ''}`;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b',
];

// --- Main Component ---

export default function VideosPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Data
  const [videos, setVideos] = useState<Video[]>([]);
  const [favourites, setFavourites] = useState<Video[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Bulk selection
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Dialogs
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(PRESET_COLORS[6]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Edit title
  const [editTitleId, setEditTitleId] = useState<number | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  // Add to folder dialog
  const [addToFolderVideoId, setAddToFolderVideoId] = useState<number | null>(null);
  const [addToFolderBulk, setAddToFolderBulk] = useState(false);

  // Add to playlist dialog
  const [addToPlaylistVideoId, setAddToPlaylistVideoId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Data Fetching ---

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [vids, favs, flds, shots, pls] = await Promise.all([
        videoService.getVideos(),
        videoService.getFavourites(),
        folderService.getFolders(),
        screenshotService.getScreenshots(),
        playlistService.getPlaylists(),
      ]);
      setVideos(vids);
      setFavourites(favs);
      setFolders(flds);
      setScreenshots(shots);
      setPlaylists(pls);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- Filtering & Sorting ---

  const filteredVideos = useMemo(() => {
    const source = activeTab === 'favourites' ? favourites : videos;
    let result = source;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((v) => v.title.toLowerCase().includes(q));
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'views':
          return b.views_count - a.views_count;
        case 'az':
          return a.title.localeCompare(b.title);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [videos, favourites, activeTab, searchQuery, sortBy]);

  const filteredScreenshots = useMemo(() => {
    if (!searchQuery.trim()) return screenshots;
    const q = searchQuery.toLowerCase();
    return screenshots.filter((s) => s.title.toLowerCase().includes(q));
  }, [screenshots, searchQuery]);

  // --- Actions ---

  const handleToggleFavourite = async (id: number) => {
    try {
      const updated = await videoService.toggleFavourite(id);
      setVideos((prev) => prev.map((v) => (v.id === id ? updated : v)));
      if (updated.is_favourite) {
        setFavourites((prev) => [...prev, updated]);
      } else {
        setFavourites((prev) => prev.filter((v) => v.id !== id));
      }
    } catch (err) {
      console.error('Failed to toggle favourite:', err);
    }
  };

  const handleToggleShare = async (id: number) => {
    try {
      const updated = await videoService.toggleSharing(id);
      setVideos((prev) => prev.map((v) => (v.id === id ? updated : v)));
      setFavourites((prev) => prev.map((v) => (v.id === id ? updated : v)));
    } catch (err) {
      console.error('Failed to toggle sharing:', err);
    }
  };

  const handleDeleteVideo = async (id: number) => {
    try {
      await videoService.deleteVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      setFavourites((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  const handleEditTitle = async (id: number) => {
    if (!editTitleValue.trim()) return;
    try {
      const updated = await videoService.updateVideo(id, { title: editTitleValue.trim() });
      setVideos((prev) => prev.map((v) => (v.id === id ? updated : v)));
      setFavourites((prev) => prev.map((v) => (v.id === id ? updated : v)));
      setEditTitleId(null);
      setEditTitleValue('');
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  const handleAddToFolder = async (folderId: number) => {
    try {
      if (addToFolderBulk) {
        await folderService.addVideosToFolder(folderId, Array.from(selectedIds));
        setSelectedIds(new Set());
        setBulkMode(false);
      } else if (addToFolderVideoId) {
        await folderService.addVideosToFolder(folderId, [addToFolderVideoId]);
      }
      setAddToFolderVideoId(null);
      setAddToFolderBulk(false);
      await fetchAll();
    } catch (err) {
      console.error('Failed to add to folder:', err);
    }
  };

  const handleAddToPlaylist = async (playlistId: number) => {
    try {
      if (addToPlaylistVideoId) {
        await playlistService.addVideo(playlistId, addToPlaylistVideoId);
      }
      setAddToPlaylistVideoId(null);
    } catch (err) {
      console.error('Failed to add to playlist:', err);
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    try {
      await videoService.bulkDelete(Array.from(selectedIds));
      setVideos((prev) => prev.filter((v) => !selectedIds.has(v.id)));
      setFavourites((prev) => prev.filter((v) => !selectedIds.has(v.id)));
      setSelectedIds(new Set());
      setBulkMode(false);
    } catch (err) {
      console.error('Failed to bulk delete:', err);
    }
  };

  const handleBulkFavourite = async () => {
    try {
      await videoService.bulkFavourite(Array.from(selectedIds));
      setSelectedIds(new Set());
      setBulkMode(false);
      await fetchAll();
    } catch (err) {
      console.error('Failed to bulk favourite:', err);
    }
  };

  const handleBulkAddToFolder = () => {
    setAddToFolderBulk(true);
    setAddToFolderVideoId(-1); // signal dialog to open
  };

  const toggleSelectVideo = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const folder = await folderService.createFolder(newFolderName.trim(), newFolderColor);
      setFolders((prev) => [...prev, folder]);
      setNewFolderName('');
      setNewFolderColor(PRESET_COLORS[6]);
      setCreateFolderOpen(false);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  // Upload
  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('video', uploadFile);
      const newVideo = await videoService.uploadVideo(formData, (p) => setUploadProgress(p));
      setVideos((prev) => [newVideo, ...prev]);
      setUploadFile(null);
      setUploadDialogOpen(false);
    } catch (err) {
      console.error('Failed to upload:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setUploadFile(file);
    }
  };

  // Screenshot actions
  const handleToggleScreenshotShare = async (id: number) => {
    try {
      const updated = await screenshotService.toggleSharing(id);
      setScreenshots((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      console.error('Failed to toggle screenshot sharing:', err);
    }
  };

  const handleDeleteScreenshot = async (id: number) => {
    try {
      await screenshotService.deleteScreenshot(id);
      setScreenshots((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete screenshot:', err);
    }
  };

  // --- Render ---

  const renderVideoCard = (video: Video) => {
    const isSelected = selectedIds.has(video.id);
    const isEditing = editTitleId === video.id;

    return (
      <Card
        key={video.id}
        className={cn(
          'group relative overflow-hidden transition-all hover:shadow-md cursor-pointer',
          isSelected && 'ring-2 ring-primary'
        )}
        onClick={() => {
          if (bulkMode) {
            toggleSelectVideo(video.id);
          } else {
            navigate(`/video/${video.id}`);
          }
        }}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <FileVideo className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          <Badge variant="secondary" className="absolute bottom-2 right-2 text-xs font-mono">
            {formatDuration(video.duration)}
          </Badge>
          {bulkMode && (
            <div
              className="absolute top-2 left-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelectVideo(video.id)}
              />
            </div>
          )}
        </div>

        <CardContent className="p-3">
          {/* Title */}
          {isEditing ? (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditTitle(video.id);
                  if (e.key === 'Escape') {
                    setEditTitleId(null);
                    setEditTitleValue('');
                  }
                }}
                className="h-7 text-sm"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => handleEditTitle(video.id)}
              >
                Save
              </Button>
            </div>
          ) : (
            <h3 className="font-medium text-sm truncate">{video.title}</h3>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatViews(video.views_count)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(video.created_at)}
            </span>
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavourite(video.id);
                }}
              >
                <Star
                  className={cn(
                    'h-3.5 w-3.5',
                    video.is_favourite
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-muted-foreground'
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleShare(video.id);
                }}
              >
                <Share2
                  className={cn(
                    'h-3.5 w-3.5',
                    video.is_shared ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-7 w-7 p-0" />} onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={() => {
                    setEditTitleId(video.id);
                    setEditTitleValue(video.title);
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToggleShare(video.id)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {video.is_shared ? 'Disable sharing' : 'Enable sharing'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToggleFavourite(video.id)}>
                  <Star className="h-4 w-4 mr-2" />
                  {video.is_favourite ? 'Remove favourite' : 'Add favourite'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setAddToFolderVideoId(video.id)}>
                  <FolderIcon className="h-4 w-4 mr-2" />
                  Add to folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAddToPlaylistVideoId(video.id)}>
                  <ListMusic className="h-4 w-4 mr-2" />
                  Add to playlist
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDeleteVideo(video.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderScreenshotCard = (screenshot: Screenshot) => (
    <Card key={screenshot.id} className="group overflow-hidden">
      <div className="relative aspect-video bg-muted">
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm truncate">{screenshot.title}</h3>
        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDate(screenshot.created_at)}
        </div>
        <div className="flex items-center justify-between mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => handleToggleScreenshotShare(screenshot.id)}
          >
            <Share2
              className={cn(
                'h-3.5 w-3.5',
                screenshot.is_shared ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive"
            onClick={() => handleDeleteScreenshot(screenshot.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (type: 'videos' | 'screenshots' | 'favourites') => {
    const config = {
      videos: {
        icon: <VideoIcon className="h-12 w-12 text-muted-foreground/40" />,
        title: 'No videos yet',
        description: 'Upload your first video to get started.',
      },
      favourites: {
        icon: <Star className="h-12 w-12 text-muted-foreground/40" />,
        title: 'No favourites',
        description: 'Star a video to add it to your favourites.',
      },
      screenshots: {
        icon: <ImageIcon className="h-12 w-12 text-muted-foreground/40" />,
        title: 'No screenshots',
        description: 'Take a screenshot to see it here.',
      },
    };
    const c = config[type];
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        {c.icon}
        <h3 className="mt-4 font-medium text-lg">{c.title}</h3>
        <p className="text-muted-foreground text-sm mt-1">{c.description}</p>
        {type === 'videos' && (
          <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload video
          </Button>
        )}
      </div>
    );
  };

  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <CardContent className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Folder Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Folders</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setCreateFolderOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
        <Separator />
        {folders.length === 0 ? (
          <p className="text-xs text-muted-foreground">No folders yet</p>
        ) : (
          <div className="space-y-1">
            {folders.map((folder) => (
              <button
                key={folder.id}
                className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors"
                onClick={() => navigate(`/folder/${folder.id}`)}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="truncate flex-1">{folder.name}</span>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  {folder.videos_count}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Library</h1>
            <div className="flex items-center gap-2">
              {!bulkMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkMode(true)}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkMode(false);
                    setSelectedIds(new Set());
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {bulkMode && selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.size} selected
              </span>
              <Separator orientation="vertical" className="h-5" />
              <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkFavourite}>
                <Heart className="h-4 w-4 mr-1" />
                Favourite
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkAddToFolder}>
                <FolderIcon className="h-4 w-4 mr-1" />
                Add to Folder
              </Button>
            </div>
          )}

          {/* Search + Sort */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(val) => setSortBy(val || 'newest')}>
              <SelectTrigger className="w-40">
                <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="az">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                <VideoIcon className="h-4 w-4 mr-1.5" />
                All Videos
              </TabsTrigger>
              <TabsTrigger value="favourites">
                <Star className="h-4 w-4 mr-1.5" />
                Favourites
              </TabsTrigger>
              <TabsTrigger value="screenshots">
                <ImageIcon className="h-4 w-4 mr-1.5" />
                Screenshots
              </TabsTrigger>
            </TabsList>

            {/* All Videos */}
            <TabsContent value="all">
              {loading ? (
                renderLoadingSkeleton()
              ) : filteredVideos.length === 0 ? (
                searchQuery ? (
                  <div className="text-center py-20">
                    <Search className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                    <h3 className="mt-4 font-medium">No results found</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Try a different search term.
                    </p>
                  </div>
                ) : (
                  renderEmptyState('videos')
                )
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredVideos.map(renderVideoCard)}
                </div>
              )}
            </TabsContent>

            {/* Favourites */}
            <TabsContent value="favourites">
              {loading ? (
                renderLoadingSkeleton()
              ) : filteredVideos.length === 0 ? (
                renderEmptyState('favourites')
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredVideos.map(renderVideoCard)}
                </div>
              )}
            </TabsContent>

            {/* Screenshots */}
            <TabsContent value="screenshots">
              {loading ? (
                renderLoadingSkeleton()
              ) : filteredScreenshots.length === 0 ? (
                renderEmptyState('screenshots')
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredScreenshots.map(renderScreenshotCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ===== Dialogs ===== */}

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>Organize your videos into folders.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="folderName">Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 transition-all',
                      newFolderColor === color
                        ? 'border-foreground scale-110'
                        : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewFolderColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        if (!uploading) {
          setUploadDialogOpen(open);
          if (!open) setUploadFile(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Video</DialogTitle>
            <DialogDescription>Choose a video file to upload.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag and drop a video file, or click to browse
              </p>
              {uploadFile && (
                <p className="mt-2 text-sm font-medium">{uploadFile.name}</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setUploadFile(file);
                }}
              />
            </div>
            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadFile(null);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Folder Dialog */}
      <Dialog
        open={addToFolderVideoId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddToFolderVideoId(null);
            setAddToFolderBulk(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Folder</DialogTitle>
            <DialogDescription>
              Select a folder to add {addToFolderBulk ? `${selectedIds.size} videos` : 'this video'} to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 py-2 max-h-64 overflow-auto">
            {folders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No folders. Create one first.
              </p>
            ) : (
              folders.map((folder) => (
                <button
                  key={folder.id}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
                  onClick={() => handleAddToFolder(folder.id)}
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: folder.color }}
                  />
                  <span className="text-sm">{folder.name}</span>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddToFolderVideoId(null);
                setAddToFolderBulk(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="outline" onClick={() => {
              setAddToFolderVideoId(null);
              setAddToFolderBulk(false);
              setCreateFolderOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-1" />
              New Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Playlist Dialog */}
      <Dialog
        open={addToPlaylistVideoId !== null}
        onOpenChange={(open) => {
          if (!open) setAddToPlaylistVideoId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Playlist</DialogTitle>
            <DialogDescription>Select a playlist.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1 py-2 max-h-64 overflow-auto">
            {playlists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No playlists. Create one first.
              </p>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
                  onClick={() => handleAddToPlaylist(pl.id)}
                >
                  <ListMusic className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{pl.name}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {pl.videos_count}
                  </Badge>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddToPlaylistVideoId(null)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
