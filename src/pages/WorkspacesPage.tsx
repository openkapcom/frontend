import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  Video,
  Building2,
  MoreHorizontal,
  Settings,
  LogOut,
  Eye,
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { workspaceService } from '@/services/workspaceService';
import { useAuthStore } from '@/stores/authStore';
import type { Workspace } from '@/types';

export default function WorkspacesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Leave dialog
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveWorkspace, setLeaveWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await workspaceService.getWorkspaces();
      setWorkspaces(data);
    } catch {
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    try {
      setCreating(true);
      const workspace = await workspaceService.createWorkspace(createName, createDescription);
      setWorkspaces((prev) => [workspace, ...prev]);
      setCreateOpen(false);
      setCreateName('');
      setCreateDescription('');
      toast.success('Workspace created');
    } catch {
      toast.error('Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleLeave = async () => {
    if (!leaveWorkspace) return;
    try {
      await workspaceService.leaveWorkspace(leaveWorkspace.slug);
      setWorkspaces((prev) => prev.filter((w) => w.id !== leaveWorkspace.id));
      setLeaveOpen(false);
      toast.success('Left workspace');
    } catch {
      toast.error('Failed to leave workspace');
    }
  };

  const openLeave = (workspace: Workspace) => {
    setLeaveWorkspace(workspace);
    setLeaveOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-40" />
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
        <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 size-4" />
            New Workspace
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
              <DialogDescription>
                Create a workspace to collaborate with your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ws-name">Name</Label>
                <Input
                  id="ws-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="My Workspace"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-desc">Description</Label>
                <Textarea
                  id="ws-desc"
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

      {workspaces.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Building2 className="mb-4 size-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No workspaces yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a workspace to start collaborating with your team.
          </p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create Workspace
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => {
            const isOwner = user?.id === workspace.owner_id;
            return (
              <Card
                key={workspace.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => navigate(`/workspace/${workspace.slug}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{workspace.name}</CardTitle>
                    {workspace.description && (
                      <CardDescription className="line-clamp-2">
                        {workspace.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />} onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={() => navigate(`/workspace/${workspace.slug}`)}
                      >
                        <Eye className="mr-2 size-4" />
                        View
                      </DropdownMenuItem>
                      {isOwner && (
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/workspace/${workspace.slug}/settings`)
                          }
                        >
                          <Settings className="mr-2 size-4" />
                          Settings
                        </DropdownMenuItem>
                      )}
                      {!isOwner && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => openLeave(workspace)}
                          >
                            <LogOut className="mr-2 size-4" />
                            Leave
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      {workspace.members_count} {workspace.members_count === 1 ? 'member' : 'members'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Video className="size-3.5" />
                      {workspace.videos_count} {workspace.videos_count === 1 ? 'video' : 'videos'}
                    </span>
                  </div>
                  {isOwner && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Owner
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Leave Workspace Confirmation */}
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to &ldquo;{leaveWorkspace?.name}&rdquo; and its content. You
              can rejoin if invited again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
