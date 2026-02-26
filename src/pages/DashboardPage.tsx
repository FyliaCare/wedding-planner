import { useEffect, useMemo } from 'react';
import { Heart, CheckCircle2, DollarSign, Users, Calendar, TrendingUp, MessageCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ActivityFeed } from '@/components/ActivityFeed';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useGuestStore } from '@/stores/guestStore';
import { daysUntil, formatCurrency, percentOf } from '@/utils';

const QUICK_LINKS = [
  { to: '/checklist', label: 'Tasks', icon: '✅', color: 'from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20', border: 'border-emerald-200 dark:border-emerald-800' },
  { to: '/budget', label: 'Budget', icon: '💵', color: 'from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20', border: 'border-amber-200 dark:border-amber-800' },
  { to: '/guests', label: 'Guests', icon: '👥', color: 'from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20', border: 'border-blue-200 dark:border-blue-800' },
  { to: '/chat', label: 'Chat', icon: '💬', color: 'from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20', border: 'border-pink-200 dark:border-pink-800' },
  { to: '/vendors', label: 'Vendors', icon: '🏪', color: 'from-purple-500/10 to-violet-500/10 hover:from-purple-500/20 hover:to-violet-500/20', border: 'border-purple-200 dark:border-purple-800' },
  { to: '/timeline', label: 'Timeline', icon: '🕐', color: 'from-cyan-500/10 to-sky-500/10 hover:from-cyan-500/20 hover:to-sky-500/20', border: 'border-cyan-200 dark:border-cyan-800' },
];

export default function DashboardPage() {
  const { wedding, isAdmin } = useAuthStore();
  const { tasks, loadTasks } = useTaskStore();
  const { categories, items, loadBudget, getTotalActual } = useBudgetStore();
  const { loadGuests, getStats } = useGuestStore();

  const weddingId = wedding?.id;

  useEffect(() => {
    if (weddingId) {
      void loadTasks(weddingId);
      void loadBudget(weddingId);
      void loadGuests(weddingId);
    }
  }, [weddingId, loadTasks, loadBudget, loadGuests]);

  const countdown = wedding?.wedding_date ? daysUntil(wedding.wedding_date) : null;
  const tasksDone = tasks.filter((t) => t.status === 'done').length;
  const tasksTotal = tasks.length;
  const taskPercent = percentOf(tasksDone, tasksTotal);
  const totalBudget = wedding?.total_budget || 0;
  const totalSpent = getTotalActual();
  const budgetPercent = percentOf(totalSpent, totalBudget);
  const guestStats = getStats();

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'done' && t.due_date)
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
        .slice(0, 5),
    [tasks]
  );

  return (
    <div className="space-y-6">
      {/* Hero Section with Couple Photos + Countdown */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-pink-500/5 to-rose-500/10 p-6 lg:p-8 animate-fade-in">
        {/* Background decorations */}
        <div className="absolute top-4 right-4 text-4xl animate-float opacity-40">💕</div>
        <div className="absolute bottom-4 left-4 text-3xl animate-float stagger-3 opacity-30">✨</div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Couple photos */}
          <div className="flex -space-x-4 shrink-0">
            {['/couple-1.jpeg', '/couple-2.jpeg', '/couple-3.jpeg'].map((photo, i) => (
              <div
                key={photo}
                className="h-20 w-20 rounded-full border-4 border-background overflow-hidden shadow-lg animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s`, zIndex: 3 - i }}
              >
                <img src={photo} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>

          {/* Text */}
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gradient animate-slide-up">
              {wedding
                ? `${wedding.partner1_name} & ${wedding.partner2_name}`
                : 'Welcome'} 💍
            </h1>
            <p className="text-muted-foreground mt-1 animate-slide-up stagger-1">
              {wedding
                ? "Your wedding planning HQ — let's make magic happen!"
                : 'Set up your wedding to get started'}
            </p>

            {/* Call-to-action when no wedding is configured */}
            {!wedding && (
              <div className="mt-3 animate-slide-up stagger-2">
                {isAdmin ? (
                  <Link to="/setup">
                    <Button className="bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 shadow-md">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Set Up Your Wedding 💍
                    </Button>
                  </Link>
                ) : (
                  <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-2 inline-block">
                    ✨ The couple hasn't set up the wedding yet — they'll get it ready soon!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Countdown */}
          {countdown !== null && countdown > 0 && (
            <div className="shrink-0 text-center animate-slide-up stagger-2">
              <div className="relative">
                <Heart className="h-6 w-6 fill-primary text-primary mx-auto mb-1 animate-heart-beat" />
                <Sparkles className="absolute -top-1 -right-2 h-4 w-4 text-amber-400 animate-bounce-gentle" />
              </div>
              <p className="text-5xl font-bold text-primary">{countdown}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                days to go
              </p>
            </div>
          )}
          {countdown === 0 && (
            <div className="shrink-0 text-center animate-slide-up stagger-2">
              <p className="text-3xl font-bold text-primary">Today! 🎉</p>
              <p className="text-xs text-muted-foreground">It's your wedding day!</p>
            </div>
          )}
          {countdown !== null && countdown < 0 && (
            <div className="shrink-0 text-center animate-slide-up stagger-2">
              <p className="text-2xl font-bold text-primary">Married! 💍</p>
              <p className="text-xs text-muted-foreground">{Math.abs(countdown)} days ago</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {QUICK_LINKS.map((link, i) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 bg-gradient-to-br ${link.color} ${link.border} transition-all duration-300 hover:scale-105 hover:shadow-md animate-slide-up`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <span className="text-2xl">{link.icon}</span>
            <span className="text-xs font-medium">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tasks */}
        <Card className="card-hover animate-slide-up stagger-1 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Complete</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksDone}/{tasksTotal}</div>
            <Progress value={taskPercent} className="mt-2 h-2 [&>div]:bg-emerald-500" />
            <p className="mt-1 text-xs text-muted-foreground">{taskPercent}% complete ✅</p>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card className="card-hover animate-slide-up stagger-2 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-yellow-400" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Spent</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <Progress
              value={budgetPercent}
              className={`mt-2 h-2 ${budgetPercent > 90 ? '[&>div]:bg-destructive' : '[&>div]:bg-amber-500'}`}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              of {formatCurrency(totalBudget)} budget 💵
            </p>
          </CardContent>
        </Card>

        {/* Guests */}
        <Card className="card-hover animate-slide-up stagger-3 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-400" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guest RSVPs</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guestStats.accepted}/{guestStats.total}</div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                ✓ {guestStats.accepted}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                ✗ {guestStats.declined}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                ? {guestStats.pending}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="card-hover animate-slide-up stagger-4 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-400 to-violet-400" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Categories</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {items.length} line items tracked 📊
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming tasks */}
      <Card className="animate-slide-up overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-pink-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Tasks
            <span className="text-lg">📋</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-4xl mb-2 block">🎯</span>
              <p className="text-sm text-muted-foreground">
                No upcoming tasks. Add some tasks in the Checklist!
              </p>
              <Link to="/checklist">
                <Button variant="outline" size="sm" className="mt-3">
                  Go to Checklist <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task, i) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-xl border p-3 card-hover animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                        task.priority === 'high'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : task.priority === 'medium'
                          ? 'bg-amber-100 dark:bg-amber-900/30'
                          : 'bg-emerald-100 dark:bg-emerald-900/30'
                      }`}
                    >
                      {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{task.category}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium rounded-full bg-muted px-2.5 py-1">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity feed + Chat shortcut */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Activity Feed */}
        {weddingId && <ActivityFeed weddingId={weddingId} />}

        {/* Quick chat access */}
        <Card className="overflow-hidden card-hover">
          <div className="h-1 bg-gradient-to-r from-pink-400 to-rose-400" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-pink-500" />
              Wedding Chat
              <span className="text-lg">💬</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['/couple-1.jpeg', '/couple-2.jpeg'].map((photo) => (
                  <div key={photo} className="h-8 w-8 rounded-full border-2 border-background overflow-hidden">
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-xs font-semibold text-primary">
                  +
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Share ideas, updates, and hype with your crew!
              </p>
            </div>
            <Link to="/chat">
              <Button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-md">
                <MessageCircle className="mr-2 h-4 w-4" />
                Open Chat 🎊
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
