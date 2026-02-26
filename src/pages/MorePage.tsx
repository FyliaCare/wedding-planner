import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

const moreItems = [
  { to: '/vendors', emoji: '🏪', label: 'Vendors', description: 'Manage your vendors', gradient: 'from-orange-400/20 to-amber-400/10' },
  { to: '/seating', emoji: '💺', label: 'Seating Chart', description: 'Plan table arrangements', gradient: 'from-blue-400/20 to-cyan-400/10' },
  { to: '/timeline', emoji: '⏰', label: 'Day-of Timeline', description: 'Wedding day schedule', gradient: 'from-purple-400/20 to-violet-400/10' },
  { to: '/mood-board', emoji: '🎨', label: 'Mood Board', description: 'Inspiration & ideas', gradient: 'from-pink-400/20 to-rose-400/10' },
  { to: '/notes', emoji: '📝', label: 'Notes', description: 'Shared notes & ideas', gradient: 'from-emerald-400/20 to-teal-400/10' },
  { to: '/settings', emoji: '⚙️', label: 'Settings', description: 'App preferences', gradient: 'from-slate-400/20 to-gray-400/10' },
];

export default function MorePage() {
  const { signOut, isAdmin } = useAuthStore();
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">✨</span>
        <div>
          <h1 className="text-2xl font-bold text-gradient">More Features</h1>
          <p className="text-xs text-muted-foreground">Everything else for your big day</p>
        </div>
      </div>

      {/* Items grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {isAdmin && (
          <Link to="/setup" className="animate-slide-up stagger-1">
            <div className="card-hover glass rounded-xl p-4 flex items-center gap-4 bg-gradient-to-br from-rose-400/20 to-pink-400/10 ring-2 ring-primary/30">
              <span className="text-3xl">👑</span>
              <div className="min-w-0">
                <p className="font-semibold truncate">Wedding Setup</p>
                <p className="text-xs text-muted-foreground truncate">Admin — configure your wedding</p>
              </div>
            </div>
          </Link>
        )}
        {moreItems.map((item, i) => (
          <Link key={item.to} to={item.to} className={`animate-slide-up stagger-${Math.min(i + 1, 5)}`}>
            <div className={`card-hover glass rounded-xl p-4 flex items-center gap-4 bg-gradient-to-br ${item.gradient}`}>
              <span className="text-3xl">{item.emoji}</span>
              <div className="min-w-0">
                <p className="font-semibold truncate">{item.label}</p>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-xl glass border-primary/20 hover:bg-primary/5"
          onClick={toggleDarkMode}
        >
          {darkMode ? <Sun className="mr-2 h-4 w-4 text-amber-500" /> : <Moon className="mr-2 h-4 w-4 text-indigo-500" />}
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-xl glass border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
          onClick={() => void signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>

      {/* Couple photo footer */}
      <div className="flex justify-center gap-2 pt-2 opacity-60">
        {['/couple-1.jpeg', '/couple-2.jpeg', '/couple-3.jpeg'].map((photo) => (
          <div key={photo} className="h-12 w-12 overflow-hidden rounded-full border-2 border-white/50">
            <img src={photo} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
