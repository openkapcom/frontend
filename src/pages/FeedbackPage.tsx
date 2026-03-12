import { useEffect, useState } from 'react';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { feedbackService } from '@/services/feedbackService';
import type { Feedback } from '@/types';

const FEEDBACK_TYPES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
];

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getFeedback();
      setFeedbackList(data);
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const newFeedback = await feedbackService.submitFeedback({
        type,
        subject: subject.trim(),
        message: message.trim(),
      });
      setFeedbackList((prev) => [newFeedback, ...prev]);
      setType('bug');
      setSubject('');
      setMessage('');
      toast.success('Feedback submitted');
    } catch {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = (id: number) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await feedbackService.deleteFeedback(deleteId);
      setFeedbackList((prev) => prev.filter((f) => f.id !== deleteId));
      setDeleteOpen(false);
      toast.success('Feedback deleted');
    } catch {
      toast.error('Failed to delete feedback');
    }
  };

  const getTypeBadge = (feedbackType: string) => {
    switch (feedbackType) {
      case 'bug':
        return (
          <Badge variant="destructive">Bug Report</Badge>
        );
      case 'feature':
        return (
          <Badge className="bg-blue-600 text-white hover:bg-blue-700">Feature Request</Badge>
        );
      default:
        return <Badge variant="secondary">Other</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-foreground text-background">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="secondary">Resolved</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Report bugs, request features, or share your thoughts.
        </p>
      </div>

      {/* Submit Feedback */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Submit Feedback</CardTitle>
          <CardDescription>We'd love to hear from you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(val) => setType(val || 'bug')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-subject">Subject</Label>
            <Input
              id="feedback-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">Message</Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your feedback in detail..."
              rows={4}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !subject.trim() || !message.trim()}
            >
              <Send className="mr-2 size-4" />
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Past Feedback */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Feedback</h2>

        {loading ? (
          <div className="max-w-2xl space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : feedbackList.length === 0 ? (
          <Card className="flex max-w-2xl flex-col items-center justify-center py-16">
            <MessageSquare className="mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No feedback yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit your first feedback above.
            </p>
          </Card>
        ) : (
          <div className="max-w-2xl space-y-4">
            {feedbackList.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(item.type)}
                        {getStatusBadge(item.status)}
                      </div>
                      <h3 className="font-semibold">{item.subject}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {item.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => openDelete(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This feedback will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
