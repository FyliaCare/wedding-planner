import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  DollarSign,
  Users,
  Store,
  Armchair,
  Clock,
  Image,
  StickyNote,
  Settings,
  Heart,
} from 'lucide-react';
import { cn } from '@/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/checklist', label: 'Checklist', icon: CheckSquare },
  { to: '/budget', label: 'Budget', icon: DollarSign },
  { to: '/guests', label: 'Guests', icon: Users },
  { to: '/vendors', label: 'Vendors', icon: Store },
  { to: '/seating', label: 'Seating', icon: Armchair },
  { to: '/timeline', label: 'Timeline', icon: Clock },
  { to: '/moodboard', label: 'Mood Board', icon: Image },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 transform border-r bg-card transition-transform duration-200 ease-in-out lg:relative lg:z-0 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Heart className="h-6 w-6 fill-primary text-primary" />
          <span className="text-lg font-bold tracking-tight">WedPlanner</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
