import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

interface GuestGuardProps {
  children: React.ReactNode;
}

export default function GuestGuard({ children }: GuestGuardProps) {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/videos" replace />;
  }

  return <>{children}</>;
}
