import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { router } from '@/router';
import { useAuthStore } from '@/stores/authStore';

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <TooltipProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </TooltipProvider>
  );
}

export default App;
