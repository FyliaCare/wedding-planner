import { useState } from 'react';
import { Moon, Sun, Trash2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/db';

export default function SettingsPage() {
  const { wedding, user, signOut, setWedding } = useAuthStore();
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  const toggleDarkMode = () => {
    const next = !darkMode;
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('wedplanner_dark_mode', String(next));
    setDarkMode(next);
  };

  const handleClearData = async () => {
    const confirmed = window.confirm(
      'Are you sure? This will delete all your local wedding data. This cannot be undone.'
    );
    if (!confirmed) return;
    await db.delete();
    setWedding(null);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || 'Not signed in'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{user?.name || 'N/A'}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void signOut()}>
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Wedding info */}
      {wedding && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Wedding Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Couple</p>
                <p className="font-medium">{wedding.partner1_name} & {wedding.partner2_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">
                  {wedding.wedding_date
                    ? new Date(wedding.wedding_date).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Venue</p>
                <p className="font-medium">{wedding.venue || 'Not set'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Budget</p>
                <p className="font-medium">
                  {wedding.total_budget
                    ? `$${wedding.total_budget.toLocaleString()}`
                    : 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleClearData}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear All Local Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
