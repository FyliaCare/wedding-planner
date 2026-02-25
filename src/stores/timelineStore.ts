import { create } from 'zustand';
import type { TimelineEvent } from '@/types';
import { db } from '@/lib/db';
import { addToSyncQueue } from '@/lib/sync';
import { generateId } from '@/utils';

interface TimelineState {
  events: TimelineEvent[];
  isLoading: boolean;

  loadTimeline: (weddingId: string) => Promise<void>;
  addEvent: (event: Omit<TimelineEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<TimelineEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  reorderEvents: (events: TimelineEvent[]) => Promise<void>;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  events: [],
  isLoading: false,

  loadTimeline: async (weddingId) => {
    set({ isLoading: true });
    try {
      const events = await db.timelineEvents
        .where('wedding_id')
        .equals(weddingId)
        .sortBy('sort_order');
      set({ events });
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addEvent: async (eventData) => {
    const event: TimelineEvent = { ...eventData, id: generateId() };
    await db.timelineEvents.add(event);
    set((s) => ({
      events: [...s.events, event].sort((a, b) => a.sort_order - b.sort_order),
    }));
    addToSyncQueue({ table: 'timeline_events', operation: 'insert', data: event as unknown as Record<string, unknown> });
  },

  updateEvent: async (id, updates) => {
    await db.timelineEvents.update(id, updates);
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
    const event = get().events.find((e) => e.id === id);
    if (event) addToSyncQueue({ table: 'timeline_events', operation: 'update', data: { ...event, ...updates } as unknown as Record<string, unknown> });
  },

  deleteEvent: async (id) => {
    await db.timelineEvents.delete(id);
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
    addToSyncQueue({ table: 'timeline_events', operation: 'delete', data: { id } });
  },

  reorderEvents: async (events) => {
    const reordered = events.map((e, i) => ({ ...e, sort_order: i }));
    for (const e of reordered) {
      await db.timelineEvents.update(e.id, { sort_order: e.sort_order });
    }
    set({ events: reordered });
  },
}));
