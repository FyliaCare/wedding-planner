// ============================================================
// Sync System Tests — Queue, Online/Offline, Processing
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module before importing sync
const mockSyncQueueAdd = vi.fn().mockResolvedValue('id');
const mockSyncQueueOrderBy = vi.fn().mockReturnValue({
  toArray: vi.fn().mockResolvedValue([]),
});
const mockSyncQueueDelete = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/db', () => ({
  db: {
    syncQueue: {
      add: mockSyncQueueAdd,
      orderBy: mockSyncQueueOrderBy,
      delete: mockSyncQueueDelete,
    },
  },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  },
  isSupabaseConfigured: true,
}));

describe('Sync System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isOnline', () => {
    it('returns navigator.onLine value', async () => {
      const { isOnline } = await import('@/lib/sync');
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      expect(isOnline()).toBe(true);
    });

    it('returns false when offline', async () => {
      const { isOnline } = await import('@/lib/sync');
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      expect(isOnline()).toBe(false);
      // Restore
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    });
  });

  describe('getSyncStatus', () => {
    it('starts with idle status', async () => {
      const { getSyncStatus } = await import('@/lib/sync');
      expect(getSyncStatus()).toBe('idle');
    });
  });

  describe('addToSyncQueue', () => {
    it('persists entry to Dexie syncQueue', async () => {
      const { addToSyncQueue } = await import('@/lib/sync');
      addToSyncQueue({
        table: 'tasks',
        operation: 'insert',
        data: { id: 'test', title: 'Test' },
      });

      // Wait for async add
      await new Promise((r) => setTimeout(r, 100));
      expect(mockSyncQueueAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          table: 'tasks',
          operation: 'insert',
          data: { id: 'test', title: 'Test' },
        })
      );
    });
  });
});
