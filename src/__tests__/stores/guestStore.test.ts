// ============================================================
// Guest Store — Full CRUD + Filtering + Stats Tests
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGuestStore } from '@/stores/guestStore';
import type { Guest } from '@/types';

vi.mock('@/lib/db', () => ({
  db: {
    guests: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
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
  generateId: vi.fn().mockReturnValue('test-guest-id'),
}));

function createGuest(overrides: Partial<Guest> = {}): Guest {
  return {
    id: 'guest-1',
    wedding_id: 'wedding-1',
    name: 'Aunt Mary',
    email: 'mary@test.com',
    phone: '555-0100',
    group: 'bride-family',
    meal_preference: 'standard',
    dietary_restrictions: '',
    plus_one: false,
    plus_one_name: '',
    rsvp_status: 'pending',
    table_id: null,
    seat_number: null,
    notes: '',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('useGuestStore', () => {
  beforeEach(() => {
    useGuestStore.setState({
      guests: [],
      isLoading: false,
      filter: { rsvpStatus: 'all', group: 'all', search: '' },
    });
  });

  // ---- Initial State ----
  describe('initial state', () => {
    it('starts with empty guests', () => {
      expect(useGuestStore.getState().guests).toEqual([]);
    });

    it('has default filters', () => {
      expect(useGuestStore.getState().filter).toEqual({
        rsvpStatus: 'all',
        group: 'all',
        search: '',
      });
    });
  });

  // ---- CRUD ----
  describe('addGuest', () => {
    it('adds guest to store', async () => {
      await useGuestStore.getState().addGuest({
        wedding_id: 'wedding-1',
        name: 'Uncle Bob',
        email: 'bob@test.com',
        phone: '',
        group: 'groom-family',
        meal_preference: 'standard',
        dietary_restrictions: '',
        plus_one: true,
        plus_one_name: 'Aunt Betty',
        rsvp_status: 'accepted',
        table_id: null,
        seat_number: null,
        notes: '',
      });
      expect(useGuestStore.getState().guests).toHaveLength(1);
      expect(useGuestStore.getState().guests[0]?.name).toBe('Uncle Bob');
    });
  });

  describe('updateGuest', () => {
    it('updates guest in store', async () => {
      useGuestStore.setState({ guests: [createGuest()] });
      await useGuestStore.getState().updateGuest('guest-1', { rsvp_status: 'accepted' });
      expect(useGuestStore.getState().guests[0]?.rsvp_status).toBe('accepted');
    });
  });

  describe('deleteGuest', () => {
    it('removes guest from store', async () => {
      useGuestStore.setState({ guests: [createGuest()] });
      await useGuestStore.getState().deleteGuest('guest-1');
      expect(useGuestStore.getState().guests).toHaveLength(0);
    });
  });

  // ---- Filtering ----
  describe('setFilter', () => {
    it('sets rsvp filter', () => {
      useGuestStore.getState().setFilter({ rsvpStatus: 'accepted' });
      expect(useGuestStore.getState().filter.rsvpStatus).toBe('accepted');
    });

    it('sets group filter', () => {
      useGuestStore.getState().setFilter({ group: 'bride-family' });
      expect(useGuestStore.getState().filter.group).toBe('bride-family');
    });

    it('merges partial filters', () => {
      useGuestStore.getState().setFilter({ rsvpStatus: 'declined' });
      useGuestStore.getState().setFilter({ search: 'Mary' });
      expect(useGuestStore.getState().filter).toEqual({
        rsvpStatus: 'declined',
        group: 'all',
        search: 'Mary',
      });
    });
  });

  describe('getFilteredGuests', () => {
    const guests: Guest[] = [
      createGuest({ id: '1', name: 'Mary', rsvp_status: 'accepted', group: 'bride-family' }),
      createGuest({ id: '2', name: 'Bob', rsvp_status: 'declined', group: 'groom-family' }),
      createGuest({ id: '3', name: 'Jane', rsvp_status: 'pending', group: 'bride-friends' }),
      createGuest({ id: '4', name: 'Mark', rsvp_status: 'invited', group: 'work' }),
    ];

    beforeEach(() => {
      useGuestStore.setState({ guests });
    });

    it('returns all guests when no filter', () => {
      expect(useGuestStore.getState().getFilteredGuests()).toHaveLength(4);
    });

    it('filters by RSVP status', () => {
      useGuestStore.getState().setFilter({ rsvpStatus: 'accepted' });
      expect(useGuestStore.getState().getFilteredGuests()).toHaveLength(1);
    });

    it('filters by group', () => {
      useGuestStore.getState().setFilter({ group: 'bride-family' });
      expect(useGuestStore.getState().getFilteredGuests()).toHaveLength(1);
    });

    it('filters by search (case-insensitive)', () => {
      useGuestStore.getState().setFilter({ search: 'mar' });
      const filtered = useGuestStore.getState().getFilteredGuests();
      expect(filtered).toHaveLength(2); // Mary and Mark
    });

    it('combines RSVP + group + search filters', () => {
      useGuestStore.getState().setFilter({ rsvpStatus: 'accepted', group: 'bride-family', search: 'mary' });
      expect(useGuestStore.getState().getFilteredGuests()).toHaveLength(1);
    });

    it('returns empty for no matches', () => {
      useGuestStore.getState().setFilter({ search: 'zzz' });
      expect(useGuestStore.getState().getFilteredGuests()).toHaveLength(0);
    });
  });

  // ---- Stats ----
  describe('getStats', () => {
    it('counts all RSVP statuses correctly', () => {
      useGuestStore.setState({
        guests: [
          createGuest({ id: '1', rsvp_status: 'accepted' }),
          createGuest({ id: '2', rsvp_status: 'accepted' }),
          createGuest({ id: '3', rsvp_status: 'declined' }),
          createGuest({ id: '4', rsvp_status: 'pending' }),
          createGuest({ id: '5', rsvp_status: 'invited' }),
          createGuest({ id: '6', rsvp_status: 'sent' }),
          createGuest({ id: '7', rsvp_status: 'accepted', plus_one: true }),
        ],
      });

      const stats = useGuestStore.getState().getStats();
      expect(stats.total).toBe(7);
      expect(stats.accepted).toBe(3);
      expect(stats.declined).toBe(1);
      expect(stats.pending).toBe(3); // pending + invited + sent
      expect(stats.plusOnes).toBe(1);
    });

    it('returns zeros for empty guest list', () => {
      const stats = useGuestStore.getState().getStats();
      expect(stats.total).toBe(0);
      expect(stats.accepted).toBe(0);
      expect(stats.declined).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.plusOnes).toBe(0);
    });
  });
});
