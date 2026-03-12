import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const { isAuthenticated, loginWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/videos', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-black p-12 lg:flex">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="OpenKap" className="size-9 rounded-lg" />
          <span className="text-lg font-semibold tracking-tight text-white">OpenKap</span>
        </div>

        {/* Feature list */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
              Record. Share.<br />Collaborate.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/50">
              The fastest way to capture your screen, annotate, and share with your team.
            </p>
          </div>

          <ul className="space-y-3">
            {[
              'Instant screen & camera recording',
              'AI-powered transcription & summaries',
              'Comments, reactions, and team workspaces',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-white/60">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/40">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
        <p className="text-xs text-white/25">
          &copy; {new Date().getFullYear()} OpenKap. All rights reserved.
        </p>
      </div>

      {/* Right panel — sign in */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <img src="/logo.svg" alt="OpenKap" className="size-8 rounded-lg" />
          <span className="text-lg font-semibold tracking-tight">OpenKap</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Use your Google account to get started
            </p>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-3 font-medium"
              onClick={loginWithGoogle}
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <span className="underline underline-offset-4 cursor-pointer hover:text-foreground transition-colors">
              Terms of Service
            </span>{' '}
            and{' '}
            <span className="underline underline-offset-4 cursor-pointer hover:text-foreground transition-colors">
              Privacy Policy
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
