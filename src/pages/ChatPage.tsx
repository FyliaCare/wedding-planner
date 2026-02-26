import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Send,
  MessageCircle,
  Loader2,
  Image as ImageIcon,
  Reply,
  Trash2,
  X,
  SmilePlus,
  ChevronDown,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { getInitials } from '@/utils';
import type { ChatMessage } from '@/types';

// ─── Constants ───────────────────────────────────────────────
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

const QUICK_REACTIONS = ['❤️', '😂', '🎉', '👏', '🔥', '💯'];

const EMOJI_PICKER = [
  '❤️', '😂', '🎉', '👏', '🔥', '💯', '😍', '🥂',
  '💕', '✨', '🙌', '💪', '😊', '🥰', '💐', '💒',
  '👰', '🤵', '💍', '🎊', '🥳', '😭', '🫶', '💗',
];

// ─── Helpers ─────────────────────────────────────────────────
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

function formatDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── Reaction Badge Component ────────────────────────────────
function ReactionBadges({
  reactions,
  userId,
  onToggle,
}: {
  reactions: Record<string, string[]>;
  userId: string;
  onToggle: (emoji: string) => void;
}) {
  const entries = Object.entries(reactions).filter(([, users]) => users.length > 0);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([emoji, users]) => {
        const isMine = users.includes(userId);
        return (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all hover:scale-110 ${
              isMine
                ? 'bg-primary/20 border border-primary/40'
                : 'bg-muted/60 border border-transparent hover:border-primary/20'
            }`}
          >
            <span>{emoji}</span>
            <span className="text-[10px] font-medium text-muted-foreground">{users.length}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Quick React Picker ──────────────────────────────────────
function QuickReactPicker({
  onPick,
  onClose,
  showFull,
  onToggleFull,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
  showFull: boolean;
  onToggleFull: () => void;
}) {
  const emojis = showFull ? EMOJI_PICKER : QUICK_REACTIONS;

  return (
    <div className="absolute bottom-full mb-1 z-20 animate-slide-up">
      <div className="bg-card border rounded-xl shadow-lg p-1.5 flex flex-wrap gap-0.5 max-w-[200px]">
        {emojis.map((e) => (
          <button
            key={e}
            onClick={() => { onPick(e); onClose(); }}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/80 transition-colors text-base hover:scale-125"
          >
            {e}
          </button>
        ))}
        {!showFull && (
          <button
            onClick={onToggleFull}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/80 transition-colors text-xs text-muted-foreground"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────
function MessageBubble({
  msg,
  isMe,
  userId,
  replyTarget,
  onReply,
  onDelete,
  onReact,
}: {
  msg: ChatMessage;
  isMe: boolean;
  userId: string;
  replyTarget: ChatMessage | undefined;
  onReply: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const [showFullEmojis, setShowFullEmojis] = useState(false);
  const actionsTimeout = useRef<NodeJS.Timeout>();

  const handlePointerEnter = () => {
    clearTimeout(actionsTimeout.current);
    setShowActions(true);
  };
  const handlePointerLeave = () => {
    actionsTimeout.current = setTimeout(() => {
      setShowActions(false);
      setShowReactPicker(false);
      setShowFullEmojis(false);
    }, 300);
  };

  // Long-press for mobile
  const longPressTimer = useRef<NodeJS.Timeout>();
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => setShowActions(true), 500);
  };
  const handleTouchEnd = () => clearTimeout(longPressTimer.current);

  if (msg.is_deleted) {
    return (
      <div className={`flex gap-2 mb-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="max-w-[75%]">
          <div className="rounded-2xl px-3.5 py-2 text-sm bg-muted/30 border border-dashed text-muted-foreground italic">
            🗑️ This message was deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-2 mb-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} group relative`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Avatar */}
      {!isMe && (
        <Avatar className="h-8 w-8 shrink-0 shadow-sm mt-auto mb-5">
          <AvatarFallback className={`text-xs font-semibold ${getColorForUser(msg.user_id)}`}>
            {getInitials(msg.user_name)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Name */}
        {!isMe && (
          <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 ml-2">
            {msg.user_name}
          </p>
        )}

        {/* Reply preview */}
        {msg.reply_to && replyTarget && (
          <div
            className={`text-[11px] px-2.5 py-1 mb-0.5 rounded-lg border-l-2 border-primary/40 bg-muted/40 text-muted-foreground truncate max-w-full ${
              isMe ? 'ml-auto' : ''
            }`}
          >
            <span className="font-semibold">{replyTarget.user_name}</span>
            <span className="ml-1">{replyTarget.is_deleted ? 'deleted message' : replyTarget.content?.slice(0, 60)}</span>
          </div>
        )}

        {/* Bubble */}
        <div className="relative">
          <div
            className={`rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
              isMe
                ? 'bg-gradient-to-br from-primary to-pink-500 text-white rounded-tr-sm'
                : 'bg-card border rounded-tl-sm'
            }`}
          >
            {/* Image */}
            {msg.image_url && (
              <div className="mb-1.5 -mx-1 -mt-0.5">
                <img
                  src={msg.image_url}
                  alt="shared"
                  className="rounded-xl max-h-64 w-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(msg.image_url!, '_blank')}
                />
              </div>
            )}
            {/* Emoji-only large display */}
            {msg.type === 'emoji' ? (
              <span className="text-4xl leading-tight">{msg.content}</span>
            ) : (
              <span className="whitespace-pre-wrap break-words">{msg.content}</span>
            )}
          </div>

          {/* Hover actions */}
          {showActions && (
            <div
              className={`absolute ${isMe ? 'left-0 -translate-x-full pr-1' : 'right-0 translate-x-full pl-1'} top-1/2 -translate-y-1/2 z-10`}
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
            >
              <div className="flex items-center gap-0.5 bg-card border rounded-full shadow-md px-1 py-0.5">
                <div className="relative">
                  <button
                    onClick={() => { setShowReactPicker(!showReactPicker); setShowFullEmojis(false); }}
                    className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                    title="React"
                  >
                    <SmilePlus className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  {showReactPicker && (
                    <QuickReactPicker
                      onPick={(emoji) => onReact(emoji)}
                      onClose={() => { setShowReactPicker(false); setShowActions(false); }}
                      showFull={showFullEmojis}
                      onToggleFull={() => setShowFullEmojis(true)}
                    />
                  )}
                </div>
                <button
                  onClick={() => { onReply(); setShowActions(false); }}
                  className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                  title="Reply"
                >
                  <Reply className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {isMe && (
                  <button
                    onClick={() => { onDelete(); setShowActions(false); }}
                    className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reactions */}
        <div className={isMe ? 'self-end' : 'self-start'}>
          <ReactionBadges
            reactions={msg.reactions ?? {}}
            userId={userId}
            onToggle={(emoji) => onReact(emoji)}
          />
        </div>

        {/* Time */}
        <p className={`text-[10px] text-muted-foreground mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-2'}`}>
          {formatTime(msg.created_at)}
        </p>
      </div>
    </div>
  );
}

// ─── Scroll to Bottom FAB ────────────────────────────────────
function ScrollToBottomButton({ onClick, unread }: { onClick: () => void; unread: number }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-2 right-4 z-10 bg-card border shadow-lg rounded-full h-9 w-9 flex items-center justify-center hover:bg-muted transition-all animate-fade-in"
    >
      <ChevronDown className="h-4 w-4" />
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
          {unread}
        </span>
      )}
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function ChatPage() {
  const { user, wedding } = useAuthStore();
  const {
    messages,
    isLoading,
    typingUsers,
    replyingTo,
    onlineUsers,
    loadMessages,
    sendMessage,
    deleteMessage,
    toggleReaction,
    setReplyingTo,
    sendTypingIndicator,
    subscribeToMessages,
  } = useChatStore();
  const [newMessage, setNewMessage] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();
  const prevMsgCount = useRef(0);
  const isNearBottom = useRef(true);

  const weddingId = wedding?.id;

  // Subscribe
  useEffect(() => {
    if (weddingId && user?.id) {
      void loadMessages(weddingId);
      const unsub = subscribeToMessages(weddingId, user.id);
      return unsub;
    }
  }, [weddingId, user?.id, loadMessages, subscribeToMessages]);

  // Scroll management
  const checkIfNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 150;
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setShowScrollBtn(!isNearBottom.current);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkIfNearBottom);
    return () => el.removeEventListener('scroll', checkIfNearBottom);
  }, [checkIfNearBottom]);

  // Auto-scroll on new messages if near bottom
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      if (isNearBottom.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setNewMsgCount(0);
      } else {
        setNewMsgCount((c) => c + (messages.length - prevMsgCount.current));
      }
    }
    prevMsgCount.current = messages.length;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMsgCount(0);
  };

  // Initial scroll
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Typing indicator throttle
  const handleTyping = () => {
    if (!weddingId || !user) return;
    if (typingTimeout.current) return;
    sendTypingIndicator(weddingId, user.id, user.name || 'Someone');
    typingTimeout.current = setTimeout(() => {
      typingTimeout.current = undefined;
    }, 2000);
  };

  // Send
  const handleSend = () => {
    if ((!newMessage.trim() && !imageUrl.trim()) || !weddingId || !user) return;

    const isEmojiOnly = /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F]{1,3}$/u.test(newMessage.trim()) && !imageUrl;

    void sendMessage({
      wedding_id: weddingId,
      user_id: user.id,
      user_name: user.name || 'Someone',
      user_avatar: user.avatar_url,
      content: newMessage.trim(),
      type: isEmojiOnly ? 'emoji' : imageUrl ? 'photo' : 'message',
      reply_to: replyingTo?.id ?? null,
      image_url: imageUrl.trim() || null,
    });

    setNewMessage('');
    setImageUrl('');
    setShowImageInput(false);
    inputRef.current?.focus();
  };

  // Message lookup for replies
  const messageMap = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    messages.forEach((m) => map.set(m.id, m));
    return map;
  }, [messages]);

  // Date separators
  const dateSeparators = useMemo(() => {
    const map = new Set<string>();
    let prevDate = '';
    for (const msg of messages) {
      const d = new Date(msg.created_at).toDateString();
      if (d !== prevDate) {
        map.add(msg.id);
        prevDate = d;
      }
    }
    return map;
  }, [messages]);

  // Typing users string
  const typingStr = useMemo(() => {
    const names = Array.from(typingUsers.values()).map((t) => t.name);
    if (names.length === 0) return '';
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} & ${names[1]} are typing...`;
    return `${names[0]} & ${names.length - 1} others are typing...`;
  }, [typingUsers]);

  const onlineCount = onlineUsers.size;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)]">
      {/* ─── Header ─────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b bg-card/50 backdrop-blur-sm px-4 py-3 rounded-t-xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm">Wedding Chat 💬</h1>
          <p className="text-xs text-muted-foreground truncate">
            {wedding?.partner1_name} & {wedding?.partner2_name}'s crew
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onlineCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
              <Users className="h-3 w-3" />
              <span className="text-emerald-500 font-semibold">{onlineCount}</span>
              <span>online</span>
            </div>
          )}
          <div className="flex -space-x-2">
            {['/couple-1.jpeg', '/couple-2.jpeg'].map((photo) => (
              <div key={photo} className="h-7 w-7 rounded-full border-2 border-background overflow-hidden">
                <img src={photo} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Messages area ──────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-hero-gradient relative"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4 animate-fade-in">
            <div className="relative">
              <span className="text-7xl block">💬</span>
              <span className="absolute -top-2 -right-2 text-2xl animate-bounce-gentle">✨</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Start the conversation!</h3>
              <p className="text-sm max-w-xs mt-1">
                Share ideas, updates, photos — or just hype each other up! 🎉
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            const showDateSep = dateSeparators.has(msg.id);

            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 border-t border-primary/10" />
                    <span className="text-[10px] text-muted-foreground font-medium bg-background/60 backdrop-blur-sm px-3 py-1 rounded-full">
                      {formatDateLabel(msg.created_at)}
                    </span>
                    <div className="flex-1 border-t border-primary/10" />
                  </div>
                )}
                <MessageBubble
                  msg={msg}
                  isMe={isMe}
                  userId={user?.id ?? ''}
                  replyTarget={msg.reply_to ? messageMap.get(msg.reply_to) : undefined}
                  onReply={() => setReplyingTo(msg)}
                  onDelete={() => void deleteMessage(msg.id)}
                  onReact={(emoji) => void toggleReaction(msg.id, emoji, user?.id ?? '')}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />

        {/* Scroll to bottom FAB */}
        {showScrollBtn && <ScrollToBottomButton onClick={scrollToBottom} unread={newMsgCount} />}
      </div>

      {/* ─── Typing indicator ───────────────────────── */}
      {typingStr && (
        <div className="px-4 py-1 bg-card/30 backdrop-blur-sm border-t border-transparent">
          <p className="text-xs text-muted-foreground animate-pulse">{typingStr}</p>
        </div>
      )}

      {/* ─── Reply preview ──────────────────────────── */}
      {replyingTo && (
        <div className="px-4 py-2 bg-muted/30 border-t flex items-center gap-2">
          <Reply className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-primary">{replyingTo.user_name}</p>
            <p className="text-xs text-muted-foreground truncate">{replyingTo.content?.slice(0, 80)}</p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="shrink-0 p-1 rounded-full hover:bg-muted">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* ─── Image URL input ────────────────────────── */}
      {showImageInput && (
        <div className="px-4 py-2 bg-muted/30 border-t flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary shrink-0" />
          <input
            autoFocus
            placeholder="Paste image URL..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); inputRef.current?.focus(); }
              if (e.key === 'Escape') { setShowImageInput(false); setImageUrl(''); }
            }}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {imageUrl && (
            <img src={imageUrl} alt="preview" className="h-8 w-8 rounded object-cover border" onError={(e) => (e.currentTarget.style.display = 'none')} />
          )}
          <button onClick={() => { setShowImageInput(false); setImageUrl(''); }} className="shrink-0 p-1 rounded-full hover:bg-muted">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* ─── Input area ─────────────────────────────── */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-3 rounded-b-xl">
        <div className="flex gap-2 items-center">
          {/* Photo button */}
          <button
            onClick={() => setShowImageInput(!showImageInput)}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              showImageInput || imageUrl ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'
            }`}
            title="Share image"
          >
            <ImageIcon className="h-4.5 w-4.5" />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              placeholder={replyingTo ? 'Reply...' : 'Type a message... ✨'}
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
                if (e.key === 'Escape' && replyingTo) {
                  setReplyingTo(null);
                }
              }}
              className="w-full h-11 rounded-full bg-muted/50 border border-primary/10 px-4 pr-10 text-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground"
            />
          </div>

          {/* Send button */}
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() && !imageUrl.trim()}
            className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 shadow-md transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
