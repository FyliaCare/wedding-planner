// ============================================================
// Timeline Store — Full CRUD + Reorder Tests
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTimelineStore } from '@/stores/timelineStore';
import type { TimelineEvent } from '@/types';

vi.mock('@/lib/db', () => ({
  db: {
    timelineEvents: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          sortBy: vi.fn().mockResolvedValue([]),
        }),
      }),
      add: vi.fn().mockResolvedValue('id'),
      update: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock('@/lib/sync', () => ({
  addToSyncQueue: vi.fn(),
}));

vi.mock('@/utils', () => ({
  generateId: vi.fn().mockReturnValue('test-event-id'),
}));

function createEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    id: 'event-1',
    wedding_id: 'wedding-1',
    title: 'Ceremony',
    start_time: '14:00',
    end_time: '15:00',
    location: 'Garden',
    responsible_person: 'Janet',
    notes: '',
    sort_order: 0,
    ...overrides,
  };
}

describe('useTimelineStore', () => {
  beforeEach(() => {
    useTimelineStore.setState({
      events: [],
      isLoading: false,
    });
  });

  // ---- Initial State ----
  describe('initial state', () => {
    it('starts with empty events', () => {
      expect(useTimelineStore.getState().events).toEqual([]);
    });
  });

  // ---- CRUD ----
  describe('addEvent', () => {
    it('adds event to store', async () => {
      await useTimelineStore.getState().addEvent({
        wedding_id: 'wedding-1',
        title: 'Reception',
        start_time: '18:00',
        end_time: '23:00',
        location: 'Ballroom',
        responsible_person: 'Jojo',
        notes: '',
        sort_order: 0,
      });
      expect(useTimelineStore.getState().events).toHaveLength(1);
    });

    it('maintains sort order', async () => {
      useTimelineStore.setState({
        events: [createEvent({ sort_order: 0 })],
      });
      await useTimelineStore.getState().addEvent({
        wedding_id: 'wedding-1',
        title: 'Cocktail Hour',
        start_time: '16:00',
        end_time: '17:00',
        location: 'Patio',
        responsible_person: '',
        notes: '',
        sort_order: 1,
      });
      const events = useTimelineStore.getState().events;
      expect(events).toHaveLength(2);
      expect(events[0]?.sort_order).toBeLessThanOrEqual(events[1]?.sort_order ?? 0);
    });
  });

  describe('updateEvent', () => {
    it('updates event in store', async () => {
      useTimelineStore.setState({ events: [createEvent()] });
      await useTimelineStore.getState().updateEvent('event-1', { title: 'Updated Ceremony' });
      expect(useTimelineStore.getState().events[0]?.title).toBe('Updated Ceremony');
    });
  });

  describe('deleteEvent', () => {
    it('removes event from store', async () => {
      useTimelineStore.setState({ events: [createEvent()] });
      await useTimelineStore.getState().deleteEvent('event-1');
      expect(useTimelineStore.getState().events).toHaveLength(0);
    });
  });

  // ---- Reorder ----
  describe('reorderEvents', () => {
    it('reassigns sequential sort_order', async () => {
      const events: TimelineEvent[] = [
        createEvent({ id: 'e1', sort_order: 5 }),
        createEvent({ id: 'e2', sort_order: 10 }),
        createEvent({ id: 'e3', sort_order: 15 }),
      ];
      // Reverse the order
      await useTimelineStore.getState().reorderEvents([events[2]!, events[0]!, events[1]!]);
      const reordered = useTimelineStore.getState().events;
      expect(reordered[0]?.sort_order).toBe(0);
      expect(reordered[1]?.sort_order).toBe(1);
      expect(reordered[2]?.sort_order).toBe(2);
    });
  });
});
