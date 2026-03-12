import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { workspaceService } from '@/services/workspaceService';
import type { Workspace } from '@/types';

export default function WorkspaceSettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const fetchWorkspace = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const data = await workspaceService.getWorkspace(slug);
      setWorkspace(data);
      setName(data.name);
      setDescription(data.description || '');
    } catch {
      toast.error('Failed to load workspace');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const handleSave = async () => {
    if (!slug || !name.trim()) return;
    try {
      setSaving(true);
      const updated = await workspaceService.updateWorkspace(slug, { name, description });
      setWorkspace(updated);
      toast.success('Workspace updated');
      // Navigate to new slug if it changed
      if (updated.slug !== slug) {
        navigate(`/workspace/${updated.slug}/settings`, { replace: true });
      }
    } catch {
      toast.error('Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slug) return;
    try {
      await workspaceService.deleteWorkspace(slug);
      toast.success('Workspace deleted');
      navigate('/workspaces');
    } catch {
      toast.error('Failed to delete workspace');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-2xl" />
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

  return (
    <div className="space-y-6 p-6">
      {/* Back link */}
      <Link
        to={`/workspace/${slug}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 size-4" />
        Back to Workspace
      </Link>

      <div className="flex items-center gap-3">
        <Settings className="size-6" />
        <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
      </div>

      {/* General Settings */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>Update your workspace information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ws-name">Name</Label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workspace name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws-desc">Description</Label>
            <Textarea
              id="ws-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="max-w-2xl border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions. Please be careful.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/30 p-4">
            <h4 className="font-medium">Delete Workspace</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently delete this workspace and all its data. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="mt-3"
              onClick={() => setDeleteOpen(true)}
            >
              Delete Workspace
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{workspace.name}&rdquo; and all its data
              including videos, members, and settings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 px-6">
            <Label htmlFor="delete-confirm" className="text-sm">
              Type <span className="font-mono font-bold">{workspace.name}</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={workspace.name}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirm('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteConfirm !== workspace.name}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
