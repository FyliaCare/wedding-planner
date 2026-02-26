import { Menu, Bell, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationPanel } from '@/components/NotificationPanel';
import { getInitials } from '@/utils';
import { isOnline } from '@/lib/sync';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuthStore();
  const { unreadCount, togglePanel } = useNotificationStore();
  const online = isOnline();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-lg px-4 lg:px-6">
      {/* Left: Menu button (mobile) */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 lg:hidden">
          <span className="text-lg">💕</span>
          <h1 className="text-sm font-bold text-gradient">Janet & Jojo</h1>
        </div>
      </div>

      {/* Right: Status + Notifications + Avatar */}
      <div className="flex items-center gap-2">
        {/* Online/offline indicator */}
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
          online 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          {online ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          <span className="hidden sm:inline font-medium">{online ? 'Online' : 'Offline'}</span>
        </div>

        {/* Notifications */}
        <div className="relative" data-notification-bell>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            onClick={togglePanel}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground animate-bounce-gentle">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          <NotificationPanel />
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2 rounded-full bg-muted/50 pl-1 pr-3 py-1">
          <Avatar className="h-7 w-7 border-2 border-primary/20">
            <AvatarImage src={user?.avatar_url || undefined} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
              {user ? getInitials(user.name || user.email) : '?'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium hidden sm:inline truncate max-w-[80px]">
            {user?.name || 'Guest'}
          </span>
        </div>
      </div>
    </header>
  );
}
