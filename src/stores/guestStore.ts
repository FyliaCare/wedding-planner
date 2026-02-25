import { create } from 'zustand';
import type { Guest, RSVPStatus, GuestGroup } from '@/types';
import { db } from '@/lib/db';
import { addToSyncQueue } from '@/lib/sync';
import { generateId } from '@/utils';

interface GuestState {
  guests: Guest[];
  isLoading: boolean;
  filter: {
    rsvpStatus: RSVPStatus | 'all';
    group: GuestGroup | 'all';
    search: string;
  };

  loadGuests: (weddingId: string) => Promise<void>;
  addGuest: (guest: Omit<Guest, 'id' | 'created_at'>) => Promise<void>;
  updateGuest: (id: string, updates: Partial<Guest>) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
  setFilter: (filter: Partial<GuestState['filter']>) => void;
  getFilteredGuests: () => Guest[];
  getStats: () => {
    total: number;
    accepted: number;
    declined: number;
    pending: number;
    plusOnes: number;
  };
}

export const useGuestStore = create<GuestState>((set, get) => ({
  guests: [],
  isLoading: false,
  filter: { rsvpStatus: 'all', group: 'all', search: '' },

  loadGuests: async (weddingId) => {
    set({ isLoading: true });
    try {
      const guests = await db.guests.where('wedding_id').equals(weddingId).toArray();
      set({ guests });
    } catch (error) {
      console.error('Failed to load guests:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addGuest: async (guestData) => {
    const guest: Guest = {
      ...guestData,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    await db.guests.add(guest);
    set((s) => ({ guests: [...s.guests, guest] }));
    addToSyncQueue({ table: 'guests', operation: 'insert', data: guest as unknown as Record<string, unknown> });
  },

  updateGuest: async (id, updates) => {
    await db.guests.update(id, updates);
    set((s) => ({
      guests: s.guests.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
    const guest = get().guests.find((g) => g.id === id);
    if (guest) addToSyncQueue({ table: 'guests', operation: 'update', data: { ...guest, ...updates } as unknown as Record<string, unknown> });
  },

  deleteGuest: async (id) => {
    await db.guests.delete(id);
    set((s) => ({ guests: s.guests.filter((g) => g.id !== id) }));
    addToSyncQueue({ table: 'guests', operation: 'delete', data: { id } });
  },

  setFilter: (filter) =>
    set((s) => ({ filter: { ...s.filter, ...filter } })),

  getFilteredGuests: () => {
    const { guests, filter } = get();
    return guests.filter((g) => {
      if (filter.rsvpStatus !== 'all' && g.rsvp_status !== filter.rsvpStatus) return false;
      if (filter.group !== 'all' && g.group !== filter.group) return false;
      if (filter.search && !g.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  },

  getStats: () => {
    const guests = get().guests;
    return {
      total: guests.length,
      accepted: guests.filter((g) => g.rsvp_status === 'accepted').length,
      declined: guests.filter((g) => g.rsvp_status === 'declined').length,
      pending: guests.filter((g) => g.rsvp_status === 'pending' || g.rsvp_status === 'invited' || g.rsvp_status === 'sent').length,
      plusOnes: guests.filter((g) => g.plus_one).length,
    };
  },
}));
