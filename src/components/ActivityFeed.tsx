import { useEffect, useState } from 'react';
import { Activity as ActivityIcon, MessageCircle, CheckCircle2, UserPlus, DollarSign, Image } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { getInitials } from '@/utils';
import type { Activity } from '@/types';

const ACTION_ICONS: Record<string, typeof ActivityIcon> = {
  message: MessageCircle,
  task: CheckCircle2,
  guest: UserPlus,
  budget: DollarSign,
  photo: Image,
};

const ACTION_COLORS: Record<string, string> = {
  message: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  task: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  guest: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  budget: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  photo: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ weddingId }: { weddingId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weddingId) return;

    async function load() {
      const { data } = await supabase
        .from('activities')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) setActivities(data as Activity[]);
      setLoading(false);
    }

    void load();

    // Subscribe to realtime activity updates
    const channel = supabase
      .channel(`activities-feed-${weddingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities', filter: `wedding_id=eq.${weddingId}` },
        (payload) => {
          setActivities((prev) => [payload.new as Activity, ...prev].slice(0, 15));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [weddingId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIcon className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-2 w-1/4 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activity yet. Start planning and updates will show here!
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = ACTION_ICONS[activity.entity_type] || ActivityIcon;
              const colorClass = ACTION_COLORS[activity.entity_type] || 'bg-gray-100 text-gray-600';
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(activity.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span>{' '}
                      {activity.action}{' '}
                      {activity.entity_name && (
                        <span className="font-medium">{activity.entity_name}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(activity.created_at)}</p>
                  </div>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
