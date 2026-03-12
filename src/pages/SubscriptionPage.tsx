import { useEffect, useState } from 'react';
import {
  Check,
  CreditCard,
  ExternalLink,
  Sparkles,
  Crown,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { subscriptionService } from '@/services/subscriptionService';
import { settingsService } from '@/services/settingsService';
import { useAuthStore } from '@/stores/authStore';
import type { SubscriptionStatus } from '@/types';

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

const FREE_FEATURES = [
  'Up to 5 videos',
  '5 minute max duration',
  'Basic recording',
  'Share links',
  'Standard quality',
];

const PRO_FEATURES = [
  'Unlimited videos',
  'Unlimited duration',
  'AI-powered features',
  'Third-party integrations',
  'Priority support',
  'Custom branding',
  'Advanced analytics',
];

export default function SubscriptionPage() {
  const { subscription, fetchSubscription } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribing, setSubscribing] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState(9);
  const [yearlyPrice, setYearlyPrice] = useState(90);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusData, historyData] = await Promise.all([
        subscriptionService.getStatus(),
        subscriptionService.getHistory(),
      ]);
      setStatus(statusData);
      setHistory(historyData);

      try {
        const publicSettings = await settingsService.getPublicSettings();
        if (publicSettings.monthly_price) {
          setMonthlyPrice(publicSettings.monthly_price as number);
        }
        if (publicSettings.yearly_price) {
          setYearlyPrice(publicSettings.yearly_price as number);
        }
      } catch {
        // Use default prices
      }
    } catch {
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const isPro = status?.tier === 'pro' && status?.is_active;

  const handleSubscribe = async () => {
    try {
      setSubscribing(true);
      const url = await subscriptionService.getCheckoutUrl('pro', interval);
      window.location.href = url;
    } catch {
      toast.error('Failed to start checkout');
      setSubscribing(false);
    }
  };

  const handleManage = async () => {
    try {
      const url = await subscriptionService.getPortalUrl();
      window.open(url, '_blank');
    } catch {
      toast.error('Failed to open billing portal');
    }
  };

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await subscriptionService.cancel();
      setCancelOpen(false);
      await fetchSubscription();
      await loadData();
      toast.success('Subscription cancelled');
    } catch {
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);
  };

  const getStatusVariant = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'succeeded':
      case 'paid':
        return 'default' as const;
      case 'pending':
        return 'secondary' as const;
      case 'failed':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Plans & Billing</h1>
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plans & Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and billing information.
        </p>
      </div>

      {/* Current Plan */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Current plan:</span>
        <Badge className={isPro ? 'bg-foreground text-background' : ''}>
          {isPro ? 'Pro' : 'Free'}
        </Badge>
        {status?.expires_at && (
          <span className="text-xs text-muted-foreground">
            {isPro ? 'Renews' : 'Expires'} {formatDate(status.expires_at)}
          </span>
        )}
      </div>

      {/* Interval Toggle */}
      <div className="flex items-center gap-1 rounded-lg border p-1 w-fit">
        <Button
          variant={interval === 'monthly' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setInterval('monthly')}
        >
          Monthly
        </Button>
        <Button
          variant={interval === 'yearly' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setInterval('yearly')}
        >
          Yearly
          <Badge variant="secondary" className="ml-2 text-xs">
            Save 17%
          </Badge>
        </Button>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-5" />
              Free
            </CardTitle>
            <CardDescription>For getting started</CardDescription>
            <div className="pt-2">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2.5">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {!isPro ? (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <div />
            )}
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="border-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="size-5" />
              Pro
            </CardTitle>
            <CardDescription>For power users</CardDescription>
            <div className="pt-2">
              <span className="text-3xl font-bold">
                ${interval === 'monthly' ? monthlyPrice : yearlyPrice}
              </span>
              <span className="text-sm text-muted-foreground">
                /{interval === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2.5">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {isPro ? (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? 'Redirecting...' : 'Subscribe'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manage / Cancel */}
      {isPro && (
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleManage}>
            <ExternalLink className="mr-2 size-4" />
            Manage Subscription
          </Button>
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => setCancelOpen(true)}
          >
            Cancel Subscription
          </Button>
        </div>
      )}

      {/* Payment History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {formatDate(payment.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatAmount(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your Pro features will remain active until the end of your current billing
              period. After that, your account will be downgraded to the Free plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
