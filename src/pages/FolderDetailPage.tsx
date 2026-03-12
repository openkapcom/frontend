import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FolderOpen,
  MoreHorizontal,
  Eye,
  Share2,
  Heart,
  Video as VideoIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { folderService } from '@/services/folderService';
import type { Video } from '@/types';

export default function FolderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const folderId = Number(id);

  const [folderName, setFolderName] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Remove video dialog
  const [removeVideoId, setRemoveVideoId] = useState<number | null>(null);

  const fetchFolder = useCallback(async () => {
    try {
      setLoading(true);
      const folders = await folderService.getFolders();
      const folder = folders.find((f) => f.id === folderId);
      if (folder) {
        setFolderName(folder.name);
        setEditName(folder.name);
      }
      const data = await folderService.getFolderVideos(folderId);
      setVideos(data);
    } catch {
      toast.error('Failed to load folder');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchFolder();
  }, [fetchFolder]);

  const handleEditFolder = async () => {
    if (!editName.trim()) return;
    try {
      await folderService.updateFolder(folderId, { name: editName });
      setFolderName(editName);
      setEditOpen(false);
      toast.success('Folder updated');
    } catch {
      toast.error('Failed to update folder');
    }
  };

  const handleDeleteFolder = async () => {
    try {
      await folderService.deleteFolder(folderId);
      toast.success('Folder deleted');
      navigate('/videos');
    } catch {
      toast.error('Failed to delete folder');
    }
  };

  const handleRemoveVideo = async () => {
    if (!removeVideoId) return;
    try {
      await folderService.removeVideoFromFolder(folderId, removeVideoId);
      setVideos((prev) => prev.filter((v) => v.id !== removeVideoId));
      setRemoveVideoId(null);
      toast.success('Video removed from folder');
    } catch {
      toast.error('Failed to remove video');
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="space-y-2 pt-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back link */}
      <Link
        to="/videos"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 size-4" />
        Back to Videos
      </Link>

      {/* Folder Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="size-6" />
          <h1 className="text-2xl font-bold tracking-tight">{folderName}</h1>
          <Badge variant="secondary">{videos.length} videos</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 size-4" />
            Rename
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <FolderOpen className="mb-4 size-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">This folder is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add videos to this folder from your library.
          </p>
          <Link to="/videos">
            <Button className="mt-4" variant="outline">Go to Videos</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <VideoIcon className="size-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
                  {formatDuration(video.duration)}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium">{video.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="size-3" />
                        {video.views_count}
                      </span>
                      <span>&middot;</span>
                      <span>{formatSize(video.size)}</span>
                      <span>&middot;</span>
                      <span>{new Date(video.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {video.is_shared && <Badge variant="secondary" className="text-xs">Shared</Badge>}
                      {video.is_favourite && (
                        <Badge variant="outline" className="text-xs">
                          <Heart className="mr-1 size-3" />
                          Fav
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/video/${video.id}`)}>
                        <Eye className="mr-2 size-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="mr-2 size-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setRemoveVideoId(video.id)}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Remove from folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Folder Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>Enter a new name for this folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditFolder} disabled={!editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the folder &ldquo;{folderName}&rdquo;. Videos inside will not be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Video Confirmation */}
      <AlertDialog open={!!removeVideoId} onOpenChange={() => setRemoveVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove video from folder?</AlertDialogTitle>
            <AlertDialogDescription>
              The video will be removed from this folder but will remain in your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveVideo}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
