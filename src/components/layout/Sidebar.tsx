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
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, emoji: '🏠' },
  { to: '/checklist', label: 'Checklist', icon: CheckSquare, emoji: '✅' },
  { to: '/budget', label: 'Budget', icon: DollarSign, emoji: '💵' },
  { to: '/guests', label: 'Guests', icon: Users, emoji: '👥' },
  { to: '/chat', label: 'Chat', icon: MessageCircle, emoji: '💬' },
  { to: '/vendors', label: 'Vendors', icon: Store, emoji: '🏪' },
  { to: '/seating', label: 'Seating', icon: Armchair, emoji: '💺' },
  { to: '/timeline', label: 'Timeline', icon: Clock, emoji: '🕐' },
  { to: '/mood-board', label: 'Mood Board', icon: Image, emoji: '🎨' },
  { to: '/notes', label: 'Notes', icon: StickyNote, emoji: '📝' },
  { to: '/settings', label: 'Settings', icon: Settings, emoji: '⚙️' },
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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 transform border-r bg-card transition-transform duration-300 ease-in-out lg:relative lg:z-0 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / Couple header */}
        <div className="border-b px-5 py-4">
          <div className="flex items-center gap-3">
            {/* Couple photo */}
            <div className="relative">
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary/30 shadow-md">
                <img src="/couple-1.jpeg" alt="Janet & Jojo" className="h-full w-full object-cover" />
              </div>
              <Heart className="absolute -bottom-0.5 -right-0.5 h-4 w-4 fill-primary text-primary animate-heart-beat" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gradient">Janet & Jojo</h2>
              <p className="text-[10px] text-muted-foreground">Wedding Planner 💕</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {navItems.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary/15 to-pink-500/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="text-base">{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
