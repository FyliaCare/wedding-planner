import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { getInitials } from '@/utils';

const AVATAR_COLORS = [
  'bg-pink-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-blue-500 text-white',
  'bg-purple-500 text-white',
  'bg-rose-500 text-white',
  'bg-teal-500 text-white',
  'bg-indigo-500 text-white',
];

function getColorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ChatPage() {
  const { user, wedding } = useAuthStore();
  const { messages, loadMessages, sendMessage, subscribeToMessages } = useChatStore();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const weddingId = wedding?.id;

  useEffect(() => {
    if (weddingId) {
      void loadMessages(weddingId);
      const unsub = subscribeToMessages(weddingId);
      return unsub;
    }
  }, [weddingId, loadMessages, subscribeToMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !weddingId || !user) return;

    void sendMessage({
      wedding_id: weddingId,
      user_id: user.id,
      user_name: user.name || 'Someone',
      user_avatar: user.avatar_url,
      content: newMessage.trim(),
      type: 'message',
    });

    setNewMessage('');
    inputRef.current?.focus();
  };

  // Group messages by date
  let lastDate = '';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-card/50 backdrop-blur-sm px-4 py-3 rounded-t-xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-sm">Wedding Chat 💬</h1>
          <p className="text-xs text-muted-foreground">
            {wedding?.partner1_name} & {wedding?.partner2_name}'s crew
          </p>
        </div>
        <div className="flex -space-x-2">
          {['/couple-1.jpeg', '/couple-2.jpeg'].map((photo) => (
            <div key={photo} className="h-7 w-7 rounded-full border-2 border-background overflow-hidden">
              <img src={photo} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-hero-gradient">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4 animate-fade-in">
            <div className="relative">
              <span className="text-7xl block">💬</span>
              <span className="absolute -top-2 -right-2 text-2xl animate-bounce-gentle">✨</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Start the conversation!</h3>
              <p className="text-sm max-w-xs mt-1">
                Share ideas, updates, photos, or just hype each other up! 🎉
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.user_id === user?.id;
            const msgDate = new Date(msg.created_at).toLocaleDateString();
            let showDateSep = false;
            if (msgDate !== lastDate) {
              showDateSep = true;
              lastDate = msgDate;
            }

            return (
              <div key={msg.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(idx * 0.02, 0.3)}s` }}>
                {showDateSep && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 border-t border-primary/10" />
                    <span className="text-[10px] text-muted-foreground font-medium bg-background/60 backdrop-blur-sm px-3 py-1 rounded-full">{msgDate}</span>
                    <div className="flex-1 border-t border-primary/10" />
                  </div>
                )}

                <div
                  className={`flex gap-2 mb-2.5 ${
                    isMe ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {!isMe && (
                    <Avatar className="h-8 w-8 shrink-0 shadow-sm">
                      <AvatarFallback className={`text-xs font-semibold ${getColorForUser(msg.user_id)}`}>
                        {getInitials(msg.user_name)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[75%] ${
                      isMe ? 'items-end' : 'items-start'
                    }`}
                  >
                    {!isMe && (
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 ml-2">
                        {msg.user_name}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                        isMe
                          ? 'bg-gradient-to-br from-primary to-pink-500 text-white rounded-tr-sm'
                          : 'bg-card border rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p
                      className={`text-[10px] text-muted-foreground mt-0.5 ${
                        isMe ? 'text-right mr-1' : 'ml-2'
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-3 rounded-b-xl">
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              placeholder="Type a message... ✨"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full h-11 rounded-full bg-muted/50 border border-primary/10 px-4 pr-10 text-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground"
            />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 shadow-md transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
