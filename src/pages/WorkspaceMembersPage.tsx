import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  RotateCw,
  X,
  Mail,
  Clock,
  Users,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { workspaceService } from '@/services/workspaceService';
import { useAuthStore } from '@/stores/authStore';
import type { WorkspaceMember, WorkspaceInvitation } from '@/types';

export default function WorkspaceMembersPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [inviting, setInviting] = useState(false);

  // Remove member
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeMember, setRemoveMember] = useState<WorkspaceMember | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const [membersData, invitationsData] = await Promise.all([
        workspaceService.getMembers(slug),
        workspaceService.getInvitations(slug),
      ]);
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInvite = async () => {
    if (!slug || !inviteEmail.trim()) return;
    try {
      setInviting(true);
      const invitation = await workspaceService.inviteMember(slug, inviteEmail, inviteRole);
      setInvitations((prev) => [invitation, ...prev]);
      setInviteEmail('');
      setInviteRole('member');
      toast.success('Invitation sent');
    } catch {
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (member: WorkspaceMember, role: string) => {
    if (!slug) return;
    try {
      await workspaceService.updateMemberRole(slug, member.user_id, role);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, role: role as 'admin' | 'member' } : m,
        ),
      );
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async () => {
    if (!slug || !removeMember) return;
    try {
      await workspaceService.removeMember(slug, removeMember.user_id);
      setMembers((prev) => prev.filter((m) => m.id !== removeMember.id));
      setRemoveOpen(false);
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleResendInvitation = async (invitation: WorkspaceInvitation) => {
    if (!slug) return;
    try {
      await workspaceService.resendInvitation(slug, invitation.id);
      toast.success('Invitation resent');
    } catch {
      toast.error('Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitation: WorkspaceInvitation) => {
    if (!slug) return;
    try {
      await workspaceService.cancelInvitation(slug, invitation.id);
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      toast.success('Invitation cancelled');
    } catch {
      toast.error('Failed to cancel invitation');
    }
  };

  const openRemove = (member: WorkspaceMember) => {
    setRemoveMember(member);
    setRemoveOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
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
        <Users className="size-6" />
        <h1 className="text-2xl font-bold tracking-tight">Members</h1>
        <Badge variant="secondary">{members.length}</Badge>
      </div>

      {/* Invite Member */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite Member</CardTitle>
          <CardDescription>Send an invitation to join this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
            </div>
            <div className="w-[140px] space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(val) => setInviteRole(val || 'member')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              <UserPlus className="mr-2 size-4" />
              {inviting ? 'Sending...' : 'Invite'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isCurrentUser = user?.id === member.user_id;
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8">
                          <AvatarImage src={member.user?.avatar} />
                          <AvatarFallback className="text-xs">
                            {member.user?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {member.user?.name || 'Unknown'}
                          {isCurrentUser && (
                            <span className="ml-1 text-muted-foreground">(you)</span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.user?.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(role) => { if (role) handleChangeRole(member, role); }}
                        disabled={isCurrentUser}
                      >
                        <SelectTrigger className="h-8 w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {!isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => openRemove(member)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Invitations</CardTitle>
              <CardDescription>
                Invitations that have been sent but not yet accepted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="size-4 text-muted-foreground" />
                          <span className="text-sm">{invitation.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="size-3" />
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleResendInvitation(invitation)}
                            title="Resend"
                          >
                            <RotateCw className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleCancelInvitation(invitation)}
                            title="Cancel"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Remove Member Confirmation */}
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeMember?.user?.name || 'This member'} will be removed from the workspace
              and lose access to all content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
