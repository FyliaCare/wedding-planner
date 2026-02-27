import { db, type SyncQueueEntry } from './db';
import { supabase } from './supabase';
import { isSupabaseConfigured } from './supabase';

type SyncStatus = 'idle' | 'syncing' | 'error';

let syncStatus: SyncStatus = 'idle';

export function isOnline(): boolean {
  return navigator.onLine;
}

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function addToSyncQueue(entry: Omit<SyncQueueEntry, 'id' | 'timestamp'>): void {
  const queueEntry: SyncQueueEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  // Persist to IndexedDB so it survives tab close
  void db.syncQueue.add(queueEntry).then(() => {
    if (isOnline() && isSupabaseConfigured) {
      void processSyncQueue();
    }
  }).catch((err) => {
    console.error('Failed to persist sync queue entry:', err);
  });
}

async function processSyncQueue(): Promise<void> {
  if (syncStatus === 'syncing') return;
  if (!isSupabaseConfigured) return;

  const entries = await db.syncQueue.orderBy('timestamp').toArray();
  if (entries.length === 0) return;

  syncStatus = 'syncing';

  try {
    for (const entry of entries) {
      const { table, operation, data } = entry;
      let error: { message: string } | null = null;

      switch (operation) {
        case 'insert': {
          const res = await supabase.from(table).insert(data);
          error = res.error;
          break;
        }
        case 'update': {
          const res = await supabase.from(table).update(data).eq('id', data['id'] as string);
          error = res.error;
          break;
        }
        case 'delete': {
          const res = await supabase.from(table).delete().eq('id', data['id'] as string);
          error = res.error;
          break;
        }
      }

      if (error) {
        console.error(`Sync error (${operation} on ${table}):`, error.message);
        // If it's a 400 Bad Request (invalid data), remove the entry — it will never succeed
        if (error.message.includes('invalid input syntax') || error.message.includes('violates')) {
          console.warn(`Removing permanently failed sync entry: ${operation} on ${table}`);
          await db.syncQueue.delete(entry.id);
          continue;
        }
        // Other errors (network, auth) — keep entry for retry but stop processing
        syncStatus = 'error';
        return;
      }

      // Success — remove from persistent queue
      await db.syncQueue.delete(entry.id);
    }
    syncStatus = 'idle';
  } catch (error) {
    console.error('Sync failed:', error);
    syncStatus = 'error';
  }
}

export async function pullFromRemote(weddingId: string): Promise<void> {
  if (!isOnline() || !isSupabaseConfigured) return;

  try {
    const tables = [
      { remote: 'tasks', local: db.tasks },
      { remote: 'budget_categories', local: db.budgetCategories },
      { remote: 'budget_items', local: db.budgetItems },
      { remote: 'guests', local: db.guests },
      { remote: 'vendors', local: db.vendors },
      { remote: 'tables', local: db.seatingTables },
      { remote: 'timeline_events', local: db.timelineEvents },
      { remote: 'mood_board_items', local: db.moodBoardItems },
      { remote: 'notes', local: db.notes },
      { remote: 'messages', local: db.messages },
      { remote: 'activities', local: db.activities },
    ] as const;

    for (const { remote, local } of tables) {
      const { data, error } = await supabase
        .from(remote)
        .select('*')
        .eq('wedding_id', weddingId);

      if (error) {
        console.error(`Pull failed for ${remote}:`, error.message);
        continue;
      }

      if (data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (local as any).bulkPut(data);
      }
    }
  } catch (error) {
    console.error('Pull from remote failed:', error);
  }
}

// Listen for connectivity changes
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void processSyncQueue();
  });
}

export default { addToSyncQueue, pullFromRemote, isOnline, getSyncStatus };
