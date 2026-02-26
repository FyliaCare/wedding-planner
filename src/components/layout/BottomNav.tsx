import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils';

const bottomNavItems = [
  { to: '/', label: 'Home', emoji: '🏠' },
  { to: '/checklist', label: 'Tasks', emoji: '✅' },
  { to: '/budget', label: 'Budget', emoji: '💵' },
  { to: '/chat', label: 'Chat', emoji: '💬' },
  { to: '/more', label: 'More', emoji: '✨' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-30 lg:hidden">
      <div className="flex items-center justify-around rounded-2xl border bg-card/90 backdrop-blur-lg shadow-lg shadow-black/5 px-1 py-1">
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
                'flex flex-1 flex-col items-center gap-0.5 py-2 rounded-xl text-xs transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className={cn('text-lg transition-transform', isActive && 'scale-110')}>{item.emoji}</span>
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
