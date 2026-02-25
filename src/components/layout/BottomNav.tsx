import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  DollarSign,
  Users,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/utils';

const bottomNavItems = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/checklist', label: 'Tasks', icon: CheckSquare },
  { to: '/budget', label: 'Budget', icon: DollarSign },
  { to: '/guests', label: 'Guests', icon: Users },
  { to: '/more', label: 'More', icon: MoreHorizontal },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card pb-safe lg:hidden">
      <div className="flex items-center justify-around">
        {bottomNavItems.map((item) => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
