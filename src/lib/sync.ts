import { db } from './db';
import { supabase } from './supabase';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface SyncQueue {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
}

let syncStatus: SyncStatus = 'idle';
const syncQueue: SyncQueue[] = [];

export function isOnline(): boolean {
  return navigator.onLine;
}

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function addToSyncQueue(entry: Omit<SyncQueue, 'id' | 'timestamp'>): void {
  syncQueue.push({
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  // Attempt immediate sync if online
  if (isOnline()) {
    void processSyncQueue();
  }
}

async function processSyncQueue(): Promise<void> {
  if (syncStatus === 'syncing' || syncQueue.length === 0) return;
  syncStatus = 'syncing';

  try {
    while (syncQueue.length > 0) {
      const entry = syncQueue[0];
      if (!entry) break;

      const { table, operation, data } = entry;

      switch (operation) {
        case 'insert':
          await supabase.from(table).insert(data);
          break;
        case 'update':
          await supabase.from(table).update(data).eq('id', data['id'] as string);
          break;
        case 'delete':
          await supabase.from(table).delete().eq('id', data['id'] as string);
          break;
      }

      syncQueue.shift();
    }
    syncStatus = 'idle';
  } catch (error) {
    console.error('Sync failed:', error);
    syncStatus = 'error';
  }
}

export async function pullFromRemote(weddingId: string): Promise<void> {
  if (!isOnline()) return;

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
    ] as const;

    for (const { remote, local } of tables) {
      const { data } = await supabase
        .from(remote)
        .select('*')
        .eq('wedding_id', weddingId);

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
