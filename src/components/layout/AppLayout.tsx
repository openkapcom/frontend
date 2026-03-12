import { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { notificationService } from '@/services/notificationService';
import type { Notification } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

import {
  Menu,
  Search,
  Bell,
  Plus,
  LayoutDashboard,
  VideoIcon,
  ListVideo,
  MessageSquare,
  CreditCard,
  Puzzle,
  Settings,
  Building2,
  User,
  LogOut,
  ChevronLeft,
  Check,
  PanelLeft,
} from 'lucide-react';

import { RecordingSetupPanel } from '@/components/global/RecordingSetupPanel';
import { ChatbotWidget } from '@/components/global/ChatbotWidget';

// Navigation items config
interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    label: 'Library',
    path: '/videos',
    icon: VideoIcon,
  },
  {
    label: 'Playlists',
    path: '/playlists',
    icon: ListVideo,
  },
  {
    label: 'Feedback',
    path: '/feedback',
    icon: MessageSquare,
  },
  {
    label: 'Plans & Billing',
    path: '/subscription',
    icon: CreditCard,
  },
  {
    label: 'Integrations',
    path: '/integrations',
    icon: Puzzle,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
  },
  {
    label: 'Workspaces',
    path: '/workspaces',
    icon: Building2,
  },
];

// Route-to-title mapping
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/videos': 'Library',
  '/playlists': 'Playlists',
  '/feedback': 'Feedback',
  '/subscription': 'Plans & Billing',
  '/integrations': 'Integrations',
  '/settings': 'Settings',
  '/workspaces': 'Workspaces',
  '/profile': 'Profile',
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, subscription, isAdmin, logout } = useAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifs, count] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch {
      // ignore
    }
  }, []);

  // Fetch and poll notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setShowLogoutDialog(false);
    logout();
  };

  // Get page title from route
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    // Exact match
    if (ROUTE_TITLES[path]) return ROUTE_TITLES[path];
    // Prefix match for nested routes
    for (const [route, title] of Object.entries(ROUTE_TITLES)) {
      if (path.startsWith(route)) return title;
    }
    return 'OpenKap';
  }, [location.pathname]);

  // Filtered nav items based on admin status
  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  // Usage stats
  const videosUsed = subscription?.videos_count ?? 0;
  const videosLimit = subscription?.videos_limit ?? 25;
  const usagePercent = videosLimit > 0 ? (videosUsed / videosLimit) * 100 : 0;
  const isFreePlan =
    !subscription?.tier || subscription.tier === 'free';

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  // Notification filtering helpers
  const unreadNotifications = notifications.filter((n) => !n.read_at);
  const commentNotifications = notifications.filter(
    (n) => n.type === 'comment' || n.type === 'reply'
  );
  const viewNotifications = notifications.filter(
    (n) => n.type === 'view' || n.type === 'views_milestone'
  );

  // Sidebar nav item renderer
  const renderNavItem = (item: NavItem, mobile = false) => {
    const isActive =
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + '/');
    const Icon = item.icon;

    const link = (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => mobile && setMobileOpen(false)}
        className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        } ${collapsed && !mobile ? 'justify-center px-0' : ''}`}
      >
        <Icon className={`size-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
        {(!collapsed || mobile) && <span>{item.label}</span>}
      </Link>
    );

    if (collapsed && !mobile) {
      return (
        <Tooltip key={item.path}>
          <TooltipTrigger render={link} />
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return link;
  };

  // Mobile sidebar content (always expanded)
  const mobileSidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Link to="/videos" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="OpenKap" className="size-8 rounded-lg" />
          <span className="text-base font-semibold tracking-tight">OpenKap</span>
        </Link>
      </div>

      <div className="px-3 pb-3">
        <Button
          className="w-full gap-2"
          onClick={() => {
            setShowRecording(true);
            setMobileOpen(false);
          }}
        >
          <Plus className="size-4" />
          New Recording
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-1">
          {visibleNavItems.map((item) => renderNavItem(item, true))}
        </nav>
      </ScrollArea>

      <div className="mt-auto">
        {isFreePlan && (
          <div className="mx-3 mb-3 rounded-lg border bg-muted/30 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium">Free Plan</span>
              <span className="text-xs text-muted-foreground">
                {videosUsed}/{videosLimit}
              </span>
            </div>
            <Progress value={usagePercent} />
            <Button
              variant="link"
              size="sm"
              className="mt-1.5 h-auto p-0 text-xs"
              onClick={() => {
                navigate('/subscription');
                setMobileOpen(false);
              }}
            >
              Upgrade plan
            </Button>
          </div>
        )}

        <Separator />

        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted" />
              }
            >
              <Avatar size="sm">
                {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{user?.name ?? 'User'}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" sideOffset={8}>
              <DropdownMenuItem onClick={() => { navigate('/profile'); setMobileOpen(false); }}>
                <User className="size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  // Notification item renderer
  const renderNotification = (notification: Notification) => (
    <button
      key={notification.id}
      className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted ${
        !notification.read_at ? 'bg-muted/40' : ''
      }`}
      onClick={() => handleMarkRead(notification.id)}
    >
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium">{notification.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {notification.message}
        </p>
      </div>
      {!notification.read_at && (
        <span className="mt-1 inline-block size-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );

  const renderNotificationList = (items: Notification[]) =>
    items.length === 0 ? (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">No notifications</p>
      </div>
    ) : (
      <div className="divide-y">
        {items.map(renderNotification)}
      </div>
    );

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop sidebar */}
        <aside
          className={`hidden shrink-0 flex-col border-r bg-background transition-[width] duration-200 ease-in-out lg:flex ${
            collapsed ? 'w-16' : 'w-60'
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Header: Logo + collapse toggle */}
            <div className={`flex h-14 items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
              <Link to="/videos" className="flex items-center gap-2.5">
                <img src="/logo.svg" alt="OpenKap" className="size-8 rounded-lg" />
                {!collapsed && (
                  <span className="text-base font-semibold tracking-tight">OpenKap</span>
                )}
              </Link>
              {!collapsed && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setCollapsed(true)}
                  className="text-muted-foreground"
                >
                  <ChevronLeft className="size-4" />
                </Button>
              )}
            </div>

            {/* New Recording */}
            <div className={`px-3 pb-3 ${collapsed ? 'flex justify-center' : ''}`}>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon"
                        onClick={() => setShowRecording(true)}
                      />
                    }
                  >
                    <Plus className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent side="right">New Recording</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  className="w-full gap-2"
                  onClick={() => setShowRecording(true)}
                >
                  <Plus className="size-4" />
                  New Recording
                </Button>
              )}
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3">
              <nav className="flex flex-col gap-1">
                {visibleNavItems.map((item) => renderNavItem(item))}
              </nav>
            </ScrollArea>

            {/* Bottom section */}
            <div className="mt-auto">
              {/* Free plan usage */}
              {isFreePlan && !collapsed && (
                <div className="mx-3 mb-3 rounded-lg border bg-muted/30 p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium">Free Plan</span>
                    <span className="text-xs text-muted-foreground">
                      {videosUsed}/{videosLimit}
                    </span>
                  </div>
                  <Progress value={usagePercent} />
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1.5 h-auto p-0 text-xs"
                    onClick={() => navigate('/subscription')}
                  >
                    Upgrade plan
                  </Button>
                </div>
              )}

              <Separator />

              {/* User area */}
              <div className={`p-3 ${collapsed ? 'flex justify-center' : ''}`}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      collapsed ? (
                        <button className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-muted" />
                      ) : (
                        <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted" />
                      )
                    }
                  >
                    <Avatar size="sm">
                      {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">{user?.name ?? 'User'}</p>
                        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align={collapsed ? 'center' : 'start'} sideOffset={8}>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="size-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                      <LogOut className="size-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Expand toggle when collapsed */}
              {collapsed && (
                <div className="flex justify-center pb-3">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setCollapsed(false)}
                          className="text-muted-foreground"
                        />
                      }
                    >
                      <PanelLeft className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent side="right">Expand sidebar</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile sidebar (Sheet) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[260px] p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            {mobileSidebarContent}
          </SheetContent>
        </Sheet>

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top header bar */}
          <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
            </Button>

            {/* Page title */}
            <h1 className="text-base font-semibold">{pageTitle}</h1>

            <div className="flex-1" />

            {/* Search */}
            <div className="relative hidden w-64 sm:block">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8" />
            </div>

            {/* Notification bell */}
            <Popover>
              <PopoverTrigger
                render={
                  <Button variant="ghost" size="icon" className="relative" />
                }
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b px-3 py-2.5">
                  <span className="text-sm font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="xs" onClick={handleMarkAllRead}>
                      <Check className="size-3" />
                      Mark all read
                    </Button>
                  )}
                </div>
                <Tabs defaultValue="all">
                  <TabsList variant="line" className="w-full px-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread">
                      Unread
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                          {unreadCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="views">Views</TabsTrigger>
                  </TabsList>
                  <ScrollArea className="max-h-[320px]">
                    <TabsContent value="all">
                      {renderNotificationList(notifications)}
                    </TabsContent>
                    <TabsContent value="unread">
                      {renderNotificationList(unreadNotifications)}
                    </TabsContent>
                    <TabsContent value="comments">
                      {renderNotificationList(commentNotifications)}
                    </TabsContent>
                    <TabsContent value="views">
                      {renderNotificationList(viewNotifications)}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </PopoverContent>
            </Popover>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>

        {/* Floating components */}
        <RecordingSetupPanel
          open={showRecording}
          onClose={() => setShowRecording(false)}
        />
        <ChatbotWidget />

        {/* Logout confirmation */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Log out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out of your account?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>
                Log out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
