// ============================================================
// Chat Store — Send, Delete, React, Reply, Typing Tests
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChatStore } from '@/stores/chatStore';
import type { ChatMessage } from '@/types';

vi.mock('@/lib/db', () => ({
  db: {
    messages: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          sortBy: vi.fn().mockResolvedValue([]),
        }),
      }),
      add: vi.fn().mockResolvedValue('id'),
      update: vi.fn().mockResolvedValue(1),
    },
  },
}));

vi.mock('@/utils', () => ({
  generateId: vi.fn().mockReturnValue('test-msg-id'),
}));

function createMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'msg-1',
    wedding_id: 'wedding-1',
    user_id: 'user-1',
    user_name: 'Janet',
    user_avatar: null,
    content: 'Hello everyone!',
    type: 'message',
    reply_to: null,
    reactions: {},
    image_url: null,
    is_deleted: false,
    created_at: '2025-01-01T12:00:00Z',
    ...overrides,
  };
}

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      isLoading: false,
      typingUsers: new Map(),
      replyingTo: null,
      onlineUsers: new Set(),
    });
  });

  // ---- Initial State ----
  describe('initial state', () => {
    it('starts with empty messages', () => {
      expect(useChatStore.getState().messages).toEqual([]);
    });

    it('starts with no typing users', () => {
      expect(useChatStore.getState().typingUsers.size).toBe(0);
    });

    it('starts with no one replying to', () => {
      expect(useChatStore.getState().replyingTo).toBeNull();
    });

    it('starts with no online users', () => {
      expect(useChatStore.getState().onlineUsers.size).toBe(0);
    });
  });

  // ---- sendMessage ----
  describe('sendMessage', () => {
    it('adds message optimistically', async () => {
      await useChatStore.getState().sendMessage({
        wedding_id: 'wedding-1',
        user_id: 'user-1',
        user_name: 'Janet',
        user_avatar: null,
        content: 'Hello!',
        type: 'message',
      });
      expect(useChatStore.getState().messages).toHaveLength(1);
      expect(useChatStore.getState().messages[0]?.content).toBe('Hello!');
    });

    it('ignores empty messages without image', async () => {
      await useChatStore.getState().sendMessage({
        wedding_id: 'wedding-1',
        user_id: 'user-1',
        user_name: 'Janet',
        user_avatar: null,
        content: '   ',
        type: 'message',
      });
      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    it('allows message with only an image (no text)', async () => {
      await useChatStore.getState().sendMessage({
        wedding_id: 'wedding-1',
        user_id: 'user-1',
        user_name: 'Janet',
        user_avatar: null,
        content: '',
        type: 'photo',
        image_url: 'https://example.com/photo.jpg',
      });
      expect(useChatStore.getState().messages).toHaveLength(1);
    });

    it('clears replyingTo after sending', async () => {
      useChatStore.setState({ replyingTo: createMessage() });
      await useChatStore.getState().sendMessage({
        wedding_id: 'wedding-1',
        user_id: 'user-1',
        user_name: 'Janet',
        user_avatar: null,
        content: 'Reply!',
        type: 'message',
        reply_to: 'msg-1',
      });
      expect(useChatStore.getState().replyingTo).toBeNull();
    });

    it('trims message content', async () => {
      await useChatStore.getState().sendMessage({
        wedding_id: 'wedding-1',
        user_id: 'user-1',
        user_name: 'Janet',
        user_avatar: null,
        content: '  Hello!  ',
        type: 'message',
      });
      expect(useChatStore.getState().messages[0]?.content).toBe('Hello!');
    });

    it('sets default reaction and deleted fields', async () => {
      await useChatStore.getState().sendMessage({
        wedding_id: 'wedding-1',
        user_id: 'user-1',
        user_name: 'Janet',
        user_avatar: null,
        content: 'Test',
        type: 'message',
      });
      const msg = useChatStore.getState().messages[0];
      expect(msg?.reactions).toEqual({});
      expect(msg?.is_deleted).toBe(false);
    });
  });

  // ---- deleteMessage ----
  describe('deleteMessage', () => {
    it('soft-deletes a message', async () => {
      useChatStore.setState({ messages: [createMessage()] });
      await useChatStore.getState().deleteMessage('msg-1');
      const msg = useChatStore.getState().messages[0];
      expect(msg?.is_deleted).toBe(true);
      expect(msg?.content).toBe('');
    });

    it('keeps other messages intact', async () => {
      useChatStore.setState({
        messages: [
          createMessage(),
          createMessage({ id: 'msg-2', content: 'Keep me' }),
        ],
      });
      await useChatStore.getState().deleteMessage('msg-1');
      expect(useChatStore.getState().messages).toHaveLength(2);
      expect(useChatStore.getState().messages[1]?.content).toBe('Keep me');
    });
  });

  // ---- toggleReaction ----
  describe('toggleReaction', () => {
    it('adds a reaction', async () => {
      useChatStore.setState({ messages: [createMessage()] });
      await useChatStore.getState().toggleReaction('msg-1', '❤️', 'user-1');
      const msg = useChatStore.getState().messages[0];
      expect(msg?.reactions['❤️']).toContain('user-1');
    });

    it('removes a reaction on second toggle', async () => {
      useChatStore.setState({
        messages: [createMessage({ reactions: { '❤️': ['user-1'] } })],
      });
      await useChatStore.getState().toggleReaction('msg-1', '❤️', 'user-1');
      const msg = useChatStore.getState().messages[0];
      expect(msg?.reactions['❤️']).toBeUndefined();
    });

    it('supports multiple users reacting', async () => {
      useChatStore.setState({
        messages: [createMessage({ reactions: { '❤️': ['user-1'] } })],
      });
      await useChatStore.getState().toggleReaction('msg-1', '❤️', 'user-2');
      const msg = useChatStore.getState().messages[0];
      expect(msg?.reactions['❤️']).toEqual(['user-1', 'user-2']);
    });

    it('supports multiple different emojis', async () => {
      useChatStore.setState({ messages: [createMessage()] });
      await useChatStore.getState().toggleReaction('msg-1', '❤️', 'user-1');
      await useChatStore.getState().toggleReaction('msg-1', '😂', 'user-1');
      const msg = useChatStore.getState().messages[0];
      expect(msg?.reactions['❤️']).toContain('user-1');
      expect(msg?.reactions['😂']).toContain('user-1');
    });

    it('does nothing for non-existent message', async () => {
      useChatStore.setState({ messages: [createMessage()] });
      await useChatStore.getState().toggleReaction('nonexistent', '❤️', 'user-1');
      const msg = useChatStore.getState().messages[0];
      expect(Object.keys(msg?.reactions ?? {})).toHaveLength(0);
    });
  });

  // ---- setReplyingTo ----
  describe('setReplyingTo', () => {
    it('sets reply target', () => {
      const msg = createMessage();
      useChatStore.getState().setReplyingTo(msg);
      expect(useChatStore.getState().replyingTo?.id).toBe('msg-1');
    });

    it('clears reply target', () => {
      useChatStore.getState().setReplyingTo(createMessage());
      useChatStore.getState().setReplyingTo(null);
      expect(useChatStore.getState().replyingTo).toBeNull();
    });
  });

  // ---- subscribeToMessages ----
  describe('subscribeToMessages', () => {
    it('returns a cleanup function', () => {
      const cleanup = useChatStore.getState().subscribeToMessages('wedding-1', 'user-1');
      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });
});
