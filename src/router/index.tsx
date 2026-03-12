import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthGuard from './AuthGuard';
import GuestGuard from './GuestGuard';
import AdminGuard from './AdminGuard';

// Lazy-loaded pages for code splitting
const AppLayout = lazy(() => import('@/components/layout/AppLayout'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const VideosPage = lazy(() => import('@/pages/VideosPage'));
const VideoPlayerPage = lazy(() => import('@/pages/VideoPlayerPage'));
const VideoEditorPage = lazy(() => import('@/pages/VideoEditorPage'));
const PlaylistsPage = lazy(() => import('@/pages/PlaylistsPage'));
const PlaylistDetailPage = lazy(() => import('@/pages/PlaylistDetailPage'));
const FolderDetailPage = lazy(() => import('@/pages/FolderDetailPage'));
const WorkspacesPage = lazy(() => import('@/pages/WorkspacesPage'));
const WorkspaceDetailPage = lazy(() => import('@/pages/WorkspaceDetailPage'));
const WorkspaceMembersPage = lazy(() => import('@/pages/WorkspaceMembersPage'));
const WorkspaceSettingsPage = lazy(() => import('@/pages/WorkspaceSettingsPage'));
const IntegrationsPage = lazy(() => import('@/pages/IntegrationsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage'));
const SubscriptionSuccessPage = lazy(() => import('@/pages/SubscriptionSuccessPage'));
const FeedbackPage = lazy(() => import('@/pages/FeedbackPage'));
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'));
const SharedVideoPage = lazy(() => import('@/pages/SharedVideoPage'));
const SharedScreenshotPage = lazy(() => import('@/pages/SharedScreenshotPage'));
const SharedPlaylistPage = lazy(() => import('@/pages/SharedPlaylistPage'));
const AcceptInvitationPage = lazy(() => import('@/pages/AcceptInvitationPage'));
const TrelloCallbackPage = lazy(() => import('@/pages/TrelloCallbackPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const routes: RouteObject[] = [
  // Guest-only routes
  {
    path: '/login',
    element: <SuspenseWrapper><GuestGuard><LoginPage /></GuestGuard></SuspenseWrapper>,
  },
  {
    path: '/auth/callback',
    element: <SuspenseWrapper><AuthCallbackPage /></SuspenseWrapper>,
  },

  // Public shared routes (no auth required)
  {
    path: '/share/video/:token',
    element: <SuspenseWrapper><SharedVideoPage /></SuspenseWrapper>,
  },
  {
    path: '/share/screenshot/:token',
    element: <SuspenseWrapper><SharedScreenshotPage /></SuspenseWrapper>,
  },
  {
    path: '/share/playlist/:token',
    element: <SuspenseWrapper><SharedPlaylistPage /></SuspenseWrapper>,
  },

  // Standalone authenticated routes (no AppLayout sidebar)
  {
    path: '/video/:id',
    element: <SuspenseWrapper><AuthGuard><VideoPlayerPage /></AuthGuard></SuspenseWrapper>,
  },
  {
    path: '/video/:id/edit',
    element: <SuspenseWrapper><AuthGuard><VideoEditorPage /></AuthGuard></SuspenseWrapper>,
  },
  {
    path: '/invite/:token',
    element: <SuspenseWrapper><AcceptInvitationPage /></SuspenseWrapper>,
  },
  {
    path: '/integrations/trello/callback',
    element: <SuspenseWrapper><AuthGuard><TrelloCallbackPage /></AuthGuard></SuspenseWrapper>,
  },

  // Authenticated routes with AppLayout
  {
    path: '/',
    element: <SuspenseWrapper><AuthGuard><AppLayout /></AuthGuard></SuspenseWrapper>,
    children: [
      {
        index: true,
        element: <Navigate to="/videos" replace />,
      },
      {
        path: 'videos',
        element: <SuspenseWrapper><VideosPage /></SuspenseWrapper>,
      },
      {
        path: 'playlists',
        element: <SuspenseWrapper><PlaylistsPage /></SuspenseWrapper>,
      },
      {
        path: 'playlist/:id',
        element: <SuspenseWrapper><PlaylistDetailPage /></SuspenseWrapper>,
      },
      {
        path: 'folder/:id',
        element: <SuspenseWrapper><FolderDetailPage /></SuspenseWrapper>,
      },
      {
        path: 'workspaces',
        element: <SuspenseWrapper><WorkspacesPage /></SuspenseWrapper>,
      },
      {
        path: 'workspace/:slug',
        element: <SuspenseWrapper><WorkspaceDetailPage /></SuspenseWrapper>,
      },
      {
        path: 'workspace/:slug/members',
        element: <SuspenseWrapper><WorkspaceMembersPage /></SuspenseWrapper>,
      },
      {
        path: 'workspace/:slug/settings',
        element: <SuspenseWrapper><WorkspaceSettingsPage /></SuspenseWrapper>,
      },
      {
        path: 'integrations',
        element: <SuspenseWrapper><IntegrationsPage /></SuspenseWrapper>,
      },
      {
        path: 'profile',
        element: <SuspenseWrapper><ProfilePage /></SuspenseWrapper>,
      },
      {
        path: 'settings',
        element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper>,
      },
      {
        path: 'subscription',
        element: <SuspenseWrapper><SubscriptionPage /></SuspenseWrapper>,
      },
      {
        path: 'subscription/success',
        element: <SuspenseWrapper><SubscriptionSuccessPage /></SuspenseWrapper>,
      },
      {
        path: 'feedback',
        element: <SuspenseWrapper><FeedbackPage /></SuspenseWrapper>,
      },
      {
        path: 'admin/dashboard',
        element: <SuspenseWrapper><AdminGuard><AdminDashboardPage /></AdminGuard></SuspenseWrapper>,
      },
    ],
  },

  // 404
  {
    path: '*',
    element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper>,
  },
];

export const router = createBrowserRouter(routes);
