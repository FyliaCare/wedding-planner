import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store, Armchair, Clock, Image, StickyNote, Settings, LogOut, Moon, Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';

const moreItems = [
  { to: '/vendors', label: 'Vendors', icon: Store, description: 'Manage your vendors' },
  { to: '/seating', label: 'Seating Chart', icon: Armchair, description: 'Plan table arrangements' },
  { to: '/timeline', label: 'Day-of Timeline', icon: Clock, description: 'Wedding day schedule' },
  { to: '/moodboard', label: 'Mood Board', icon: Image, description: 'Inspiration & ideas' },
  { to: '/notes', label: 'Notes', icon: StickyNote, description: 'Shared notes & ideas' },
  { to: '/settings', label: 'Settings', icon: Settings, description: 'App preferences' },
];

export default function MorePage() {
  const { signOut } = useAuthStore();
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">More</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        {moreItems.map((item) => (
          <Link key={item.to} to={item.to}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => void signOut()}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
