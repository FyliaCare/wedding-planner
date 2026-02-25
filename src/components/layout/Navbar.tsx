import { Menu, Bell, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { getInitials } from '@/utils';
import { isOnline } from '@/lib/sync';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuthStore();
  const online = isOnline();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      {/* Left: Menu button (mobile) */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold lg:hidden">WedPlanner</h1>
      </div>

      {/* Right: Status + Notifications + Avatar */}
      <div className="flex items-center gap-3">
        {/* Online/offline indicator */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {online ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-amber-500" />
          )}
          <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            3
          </span>
        </Button>

        {/* User avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {user ? getInitials(user.name || user.email) : '?'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
