import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { useNotificationStore, type AppNotification } from '@/stores/notificationStore';

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

function NotificationItem({ notif, onClick }: { notif: AppNotification; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-primary/5 ${
        notif.read ? 'opacity-60' : ''
      }`}
    >
      <span className="text-xl flex-shrink-0 mt-0.5">{notif.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm truncate ${notif.read ? 'font-normal' : 'font-semibold'}`}>
            {notif.title}
          </p>
          {!notif.read && (
            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{notif.body}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{timeAgo(notif.timestamp)}</p>
      </div>
    </button>
  );
}

export function NotificationPanel() {
  const { notifications, unreadCount, panelOpen, closePanel, markAllRead, markRead } =
    useNotificationStore();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!panelOpen) return;

    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Check if the click is on the bell button (let toggle handle it)
        const bell = (e.target as Element)?.closest('[data-notification-bell]');
        if (!bell) closePanel();
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [panelOpen, closePanel]);

  // Close on Escape
  useEffect(() => {
    if (!panelOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closePanel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [panelOpen, closePanel]);

  if (!panelOpen) return null;

  function handleNotifClick(notif: AppNotification) {
    markRead(notif.id);
    if (notif.type === 'message') {
      navigate('/chat');
    }
    closePanel();
  }

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] rounded-xl border bg-card/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors"
            >
              <Check className="h-3 w-3" /> Mark all read
            </button>
          )}
          <button
            onClick={closePanel}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="overflow-y-auto max-h-[calc(70vh-52px)] divide-y divide-border/50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <BellOff className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Activity and messages will appear here ✨
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notif={notif}
              onClick={() => handleNotifClick(notif)}
            />
          ))
        )}
      </div>
    </div>
  );
}
