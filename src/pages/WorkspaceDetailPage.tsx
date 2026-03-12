import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Settings,
  LogOut,
  Eye,
  Video as VideoIcon,
  MoreHorizontal,
  Share2,
  Heart,
  Building2,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { workspaceService } from '@/services/workspaceService';
import { useAuthStore } from '@/stores/authStore';
import type { Workspace, Video } from '@/types';

export default function WorkspaceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const isOwner = user?.id === workspace?.owner_id;

  const fetchData = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const [ws, vids] = await Promise.all([
        workspaceService.getWorkspace(slug),
        workspaceService.getWorkspaceVideos(slug),
      ]);
      setWorkspace(ws);
      setVideos(vids);
    } catch {
      toast.error('Failed to load workspace');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLeave = async () => {
    if (!slug) return;
    try {
      await workspaceService.leaveWorkspace(slug);
      toast.success('Left workspace');
      navigate('/workspaces');
    } catch {
      toast.error('Failed to leave workspace');
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
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
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

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <p className="text-muted-foreground">Workspace not found</p>
        <Link to="/workspaces">
          <Button className="mt-4" variant="outline">Back to Workspaces</Button>
        </Link>
      </div>
    );
  }

  const memberAvatars = workspace.members?.slice(0, 5) || [];

  return (
    <div className="space-y-6 p-6">
      {/* Back link */}
      <Link
        to="/workspaces"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 size-4" />
        Back to Workspaces
      </Link>

      {/* Workspace Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Building2 className="size-6" />
            <h1 className="text-2xl font-bold tracking-tight">{workspace.name}</h1>
          </div>
          {workspace.description && (
            <p className="text-sm text-muted-foreground">{workspace.description}</p>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Users className="mr-1 size-3" />
              {workspace.members_count} {workspace.members_count === 1 ? 'member' : 'members'}
            </Badge>
            <Badge variant="outline">
              <VideoIcon className="mr-1 size-3" />
              {workspace.videos_count} videos
            </Badge>
            {isOwner && <Badge>Owner</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick member avatars */}
          {memberAvatars.length > 0 && (
            <div className="flex -space-x-2">
              {memberAvatars.map((member) => (
                <Avatar key={member.id} className="size-8 border-2 border-background">
                  <AvatarImage src={member.user?.avatar} />
                  <AvatarFallback className="text-xs">
                    {member.user?.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {workspace.members_count > 5 && (
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                  +{workspace.members_count - 5}
                </div>
              )}
            </div>
          )}

          {isOwner && (
            <Link to={`/workspace/${slug}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 size-4" />
                Settings
              </Button>
            </Link>
          )}
          {!isOwner && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => setLeaveOpen(true)}
            >
              <LogOut className="mr-2 size-4" />
              Leave
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="videos">
        <TabsList>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="members" onClick={() => navigate(`/workspace/${slug}/members`)}>
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-6">
          {videos.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16">
              <VideoIcon className="mb-4 size-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No videos yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Videos shared with this workspace will appear here.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <Card
                  key={video.id}
                  className="cursor-pointer overflow-hidden transition-colors hover:bg-muted/50"
                  onClick={() => navigate(`/video/${video.id}`)}
                >
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
                        {video.user && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            by {video.user.name}
                          </p>
                        )}
                        <div className="mt-2 flex gap-1.5">
                          {video.is_shared && (
                            <Badge variant="secondary" className="text-xs">
                              <Share2 className="mr-1 size-3" />
                              Shared
                            </Badge>
                          )}
                          {video.is_favourite && (
                            <Badge variant="outline" className="text-xs">
                              <Heart className="mr-1 size-3" />
                              Fav
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" className="size-8" />}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={() => navigate(`/video/${video.id}`)}
                          >
                            <Eye className="mr-2 size-4" />
                            View
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Leave Workspace Confirmation */}
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to &ldquo;{workspace.name}&rdquo; and its content. You can
              rejoin if invited again.
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
