import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="OpenKap" className="size-6 rounded" />
          <span className="text-lg font-bold tracking-tight">OpenKap</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-bold tracking-tighter">404</h1>
          <p className="text-lg text-muted-foreground">Page not found</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Button variant="outline" className="gap-2" onClick={() => navigate('/videos')}>
          <ArrowLeft className="size-4" />
          Go back home
        </Button>
      </div>
    </div>
  );
}
