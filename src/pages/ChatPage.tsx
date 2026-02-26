import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { getInitials } from '@/utils';

const AVATAR_COLORS = [
  'bg-primary text-primary-foreground',
  'bg-pink-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-blue-500 text-white',
  'bg-purple-500 text-white',
  'bg-rose-500 text-white',
  'bg-teal-500 text-white',
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
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <MessageCircle className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-semibold">Wedding Chat 💬</h1>
          <p className="text-xs text-muted-foreground">
            {wedding?.partner1_name} & {wedding?.partner2_name}'s wedding crew
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-3">
            <div className="text-6xl">💬</div>
            <h3 className="text-lg font-medium">No messages yet!</h3>
            <p className="text-sm max-w-xs">
              Be the first to say something. Share ideas, updates, or just say hi!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            const msgDate = new Date(msg.created_at).toLocaleDateString();
            let showDateSep = false;
            if (msgDate !== lastDate) {
              showDateSep = true;
              lastDate = msgDate;
            }

            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 border-t" />
                    <span className="text-xs text-muted-foreground">{msgDate}</span>
                    <div className="flex-1 border-t" />
                  </div>
                )}

                <div
                  className={`flex gap-2.5 mb-2 ${
                    isMe ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {!isMe && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={`text-xs ${getColorForUser(msg.user_id)}`}>
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
                      <p className="text-xs font-medium text-muted-foreground mb-0.5 ml-1">
                        {msg.user_name}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p
                      className={`text-[10px] text-muted-foreground mt-0.5 ${
                        isMe ? 'text-right mr-1' : 'ml-1'
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
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
