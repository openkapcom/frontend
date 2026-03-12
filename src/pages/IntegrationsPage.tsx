import { useEffect, useState } from 'react';
import {
  Link2,
  Unlink,
  ExternalLink,
  MessageSquare,
  Trello,
  Bug,
  FileText,
  Hash,
  Github,
  Plug,
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
import { integrationService } from '@/services/integrationService';
import type { Integration } from '@/types';

const providerIcons: Record<string, React.ReactNode> = {
  slack: <MessageSquare className="size-6" />,
  jira: <Bug className="size-6" />,
  trello: <Trello className="size-6" />,
  linear: <FileText className="size-6" />,
  notion: <FileText className="size-6" />,
  discord: <Hash className="size-6" />,
  github: <Github className="size-6" />,
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  // Disconnect dialog
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnectProvider, setDisconnectProvider] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const data = await integrationService.getIntegrations();
      setIntegrations(data);
    } catch {
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      setConnecting(provider);
      const url = await integrationService.getConnectUrl(provider);
      window.open(url, '_blank', 'width=600,height=700');
    } catch {
      toast.error('Failed to get connect URL');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectProvider) return;
    try {
      await integrationService.disconnect(disconnectProvider);
      setIntegrations((prev) =>
        prev.map((i) =>
          i.provider === disconnectProvider
            ? { ...i, connected: false, connected_at: undefined }
            : i,
        ),
      );
      setDisconnectOpen(false);
      toast.success('Integration disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const openDisconnect = (provider: string) => {
    setDisconnectProvider(provider);
    setDisconnectOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="size-10 rounded" />
                <Skeleton className="mt-2 h-5 w-24" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your favourite tools to share and collaborate more efficiently.
        </p>
      </div>

      {integrations.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Plug className="mb-4 size-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No integrations available</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back later for new integrations.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.provider}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                      {providerIcons[integration.provider] || (
                        <Link2 className="size-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{integration.name}</CardTitle>
                    </div>
                  </div>
                  {integration.connected ? (
                    <Badge className="bg-foreground text-background">Connected</Badge>
                  ) : (
                    <Badge variant="outline">Not connected</Badge>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {integration.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {integration.connected ? (
                  <div className="space-y-3">
                    {integration.connected_at && (
                      <p className="text-xs text-muted-foreground">
                        Connected {new Date(integration.connected_at).toLocaleDateString()}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => openDisconnect(integration.provider)}
                    >
                      <Unlink className="mr-2 size-4" />
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleConnect(integration.provider)}
                    disabled={connecting === integration.provider}
                  >
                    <ExternalLink className="mr-2 size-4" />
                    {connecting === integration.provider ? 'Connecting...' : 'Connect'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Disconnect Confirmation */}
      <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect integration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect the integration. You can reconnect it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>Disconnect</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
