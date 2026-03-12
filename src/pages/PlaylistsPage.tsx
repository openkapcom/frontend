import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  MoreHorizontal,
  Share2,
  Pencil,
  Trash2,
  Lock,
  ListVideo,
  ArrowUpDown,
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { playlistService } from '@/services/playlistService';
import type { Playlist } from '@/types';

export default function PlaylistsPage() {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('newest');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editPlaylist, setEditPlaylist] = useState<Playlist | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Password dialog
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordPlaylist, setPasswordPlaylist] = useState<Playlist | null>(null);
  const [password, setPassword] = useState('');

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePlaylist, setDeletePlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const data = await playlistService.getPlaylists();
      setPlaylists(data);
    } catch {
      toast.error('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const sortedPlaylists = [...playlists].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'videos':
        return b.videos_count - a.videos_count;
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const handleCreate = async () => {
    if (!createName.trim()) return;
    try {
      setCreating(true);
      const playlist = await playlistService.createPlaylist(createName, createDescription);
      setPlaylists((prev) => [playlist, ...prev]);
      setCreateOpen(false);
      setCreateName('');
      setCreateDescription('');
      toast.success('Playlist created');
    } catch {
      toast.error('Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!editPlaylist || !editName.trim()) return;
    try {
      const updated = await playlistService.updatePlaylist(editPlaylist.id, {
        name: editName,
        description: editDescription,
      });
      setPlaylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditOpen(false);
      toast.success('Playlist updated');
    } catch {
      toast.error('Failed to update playlist');
    }
  };

  const handleDelete = async () => {
    if (!deletePlaylist) return;
    try {
      await playlistService.deletePlaylist(deletePlaylist.id);
      setPlaylists((prev) => prev.filter((p) => p.id !== deletePlaylist.id));
      setDeleteOpen(false);
      toast.success('Playlist deleted');
    } catch {
      toast.error('Failed to delete playlist');
    }
  };

  const handleToggleSharing = async (playlist: Playlist) => {
    try {
      const updated = await playlistService.toggleSharing(playlist.id);
      setPlaylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(updated.is_shared ? 'Sharing enabled' : 'Sharing disabled');
    } catch {
      toast.error('Failed to toggle sharing');
    }
  };

  const handleSetPassword = async () => {
    if (!passwordPlaylist) return;
    try {
      await playlistService.setPassword(passwordPlaylist.id, password || null);
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === passwordPlaylist.id
            ? { ...p, has_password: !!password }
            : p,
        ),
      );
      setPasswordOpen(false);
      setPassword('');
      toast.success(password ? 'Password set' : 'Password removed');
    } catch {
      toast.error('Failed to set password');
    }
  };

  const openEdit = (playlist: Playlist) => {
    setEditPlaylist(playlist);
    setEditName(playlist.name);
    setEditDescription(playlist.description || '');
    setEditOpen(true);
  };

  const openPassword = (playlist: Playlist) => {
    setPasswordPlaylist(playlist);
    setPassword('');
    setPasswordOpen(true);
  };

  const openDelete = (playlist: Playlist) => {
    setDeletePlaylist(playlist);
    setDeleteOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Playlists</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-4 w-48 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-20 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Playlists</h1>
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={(val) => setSortBy(val || 'newest')}>
            <SelectTrigger className="w-[150px]">
              <ArrowUpDown className="mr-2 size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="videos">Most videos</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 size-4" />
              New Playlist
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Playlist</DialogTitle>
                <DialogDescription>
                  Create a new playlist to organize your videos.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playlist-name">Name</Label>
                  <Input
                    id="playlist-name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="My playlist"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playlist-desc">Description</Label>
                  <Textarea
                    id="playlist-desc"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating || !createName.trim()}>
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {sortedPlaylists.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <ListVideo className="mb-4 size-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No playlists yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first playlist to organize your videos.
          </p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create Playlist
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPlaylists.map((playlist) => (
            <Card
              key={playlist.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => navigate(`/playlist/${playlist.id}`)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base">{playlist.name}</CardTitle>
                  {playlist.description && (
                    <CardDescription className="line-clamp-2">
                      {playlist.description}
                    </CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />} onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => openEdit(playlist)}>
                      <Pencil className="mr-2 size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleSharing(playlist)}>
                      <Share2 className="mr-2 size-4" />
                      {playlist.is_shared ? 'Disable sharing' : 'Enable sharing'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openPassword(playlist)}>
                      <Lock className="mr-2 size-4" />
                      Set password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => openDelete(playlist)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {playlist.videos_count} {playlist.videos_count === 1 ? 'video' : 'videos'}
                  </span>
                  <span>&middot;</span>
                  <span>{new Date(playlist.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  {playlist.is_shared && <Badge variant="secondary">Shared</Badge>}
                  {playlist.has_password && (
                    <Badge variant="outline">
                      <Lock className="mr-1 size-3" />
                      Protected
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
            <DialogDescription>Update your playlist details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Password</DialogTitle>
            <DialogDescription>
              Protect this playlist with a password. Leave empty to remove the password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="playlist-password">Password</Label>
            <Input
              id="playlist-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password or leave empty"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetPassword}>
              {password ? 'Set Password' : 'Remove Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deletePlaylist?.name}&rdquo;. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
