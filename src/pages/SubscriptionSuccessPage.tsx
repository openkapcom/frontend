import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { subscriptionService } from '@/services/subscriptionService';
import { useAuthStore } from '@/stores/authStore';

export default function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const { fetchSubscription } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setError('Missing session ID. Please try again.');
      setLoading(false);
      return;
    }
    handleSuccess(sessionId);
  }, [searchParams]);

  const handleSuccess = async (sessionId: string) => {
    try {
      setLoading(true);
      await subscriptionService.handleCheckoutSuccess(sessionId);
      await fetchSubscription();
    } catch {
      setError('Failed to activate subscription. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-16">
            <div className="mb-6 size-16 animate-pulse rounded-full bg-muted" />
            <h2 className="text-lg font-semibold">Processing your subscription...</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we activate your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-16">
            <AlertCircle className="mb-6 size-16 text-destructive" />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {error}
            </p>
            <Link to="/settings/subscription">
              <Button className="mt-8">Back to Billing</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-16">
          <style>{`
            @keyframes success-pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.85; }
            }
            .success-icon {
              animation: success-pulse 2s ease-in-out infinite;
            }
          `}</style>
          <CheckCircle className="success-icon mb-6 size-20 text-green-500" />
          <h2 className="text-2xl font-bold">Subscription Activated!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your Pro plan is now active. Enjoy all premium features.
          </p>
          <Link to="/videos">
            <Button className="mt-8">Go to Library</Button>
          </Link>
          <p className="mt-6 text-xs text-muted-foreground">
            ScreenSense
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
