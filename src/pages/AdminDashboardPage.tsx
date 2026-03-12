import { useEffect, useState } from 'react';
import { Users, Video, HardDrive, Activity } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { adminService } from '@/services/adminService';
import type { AdminStats } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="mb-3 h-8 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="mb-3 h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total_users.toLocaleString(),
      icon: Users,
    },
    {
      title: 'Total Videos',
      value: stats.total_videos.toLocaleString(),
      icon: Video,
    },
    {
      title: 'Total Storage',
      value: formatBytes(stats.total_storage),
      icon: HardDrive,
    },
    {
      title: 'Active Today',
      value: stats.recent_users.length.toString(),
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of platform usage and activity.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Data */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recent_users.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No users yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recent_users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-sm font-medium">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Videos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Videos</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recent_videos.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No videos yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Uploader</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recent_videos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell className="text-sm font-medium">
                        {video.title}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {video.user?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDuration(video.duration)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(video.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
