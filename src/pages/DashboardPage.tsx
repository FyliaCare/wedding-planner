import { useEffect, useMemo } from 'react';
import { Heart, CheckCircle2, DollarSign, Users, Calendar, TrendingUp, MessageCircle } from 'lucide-react';
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

export default function DashboardPage() {
  const { wedding } = useAuthStore();
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
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {wedding
            ? `${wedding.partner1_name} & ${wedding.partner2_name} 💍`
            : 'Welcome'}
        </h1>
        <p className="text-muted-foreground">
          {wedding
            ? 'Wedding planning HQ — let\'s make magic happen!'
            : 'Set up your wedding to get started'}
        </p>
      </div>

      {/* Countdown card */}
      {countdown !== null && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-8 w-8 fill-primary text-primary" />
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">
                {countdown > 0 ? countdown : countdown === 0 ? "Today!" : "Congratulations!"}
              </p>
              <p className="text-sm text-muted-foreground">
                {countdown > 0
                  ? `days until your wedding`
                  : countdown === 0
                  ? "It's your wedding day!"
                  : "Your wedding has passed"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Complete</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksDone}/{tasksTotal}</div>
            <Progress value={taskPercent} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-muted-foreground">{taskPercent}% complete</p>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <Progress
              value={budgetPercent}
              className={`mt-2 h-2 ${budgetPercent > 90 ? '[&>div]:bg-destructive' : ''}`}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              of {formatCurrency(totalBudget)} budget
            </p>
          </CardContent>
        </Card>

        {/* Guests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guest RSVPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guestStats.accepted}/{guestStats.total}</div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-emerald-600">{guestStats.accepted} accepted</span>
              <span className="text-destructive">{guestStats.declined} declined</span>
              <span className="text-amber-600">{guestStats.pending} pending</span>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {items.length} line items tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming tasks. Add some tasks in the Checklist!
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        task.priority === 'high'
                          ? 'bg-destructive'
                          : task.priority === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{task.category}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
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
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Wedding Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Chat with your wedding crew — share updates, ideas, and keep everyone in the loop!
            </p>
            <Link to="/chat">
              <Button className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                Open Chat
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
