import { create } from 'zustand';
import type { Vendor, VendorCategory } from '@/types';
import { db } from '@/lib/db';
import { addToSyncQueue } from '@/lib/sync';
import { generateId } from '@/utils';

interface VendorState {
  vendors: Vendor[];
  isLoading: boolean;
  filter: { category: VendorCategory | 'all'; search: string };

  loadVendors: (weddingId: string) => Promise<void>;
  addVendor: (vendor: Omit<Vendor, 'id' | 'created_at'>) => Promise<void>;
  updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  setFilter: (filter: Partial<VendorState['filter']>) => void;
  getFilteredVendors: () => Vendor[];
  getTotalCost: () => number;
  getTotalDeposits: () => number;
}

export const useVendorStore = create<VendorState>((set, get) => ({
  vendors: [],
  isLoading: false,
  filter: { category: 'all', search: '' },

  loadVendors: async (weddingId) => {
    set({ isLoading: true });
    try {
      const vendors = await db.vendors.where('wedding_id').equals(weddingId).toArray();
      set({ vendors });
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addVendor: async (vendorData) => {
    const vendor: Vendor = {
      ...vendorData,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    try {
      await db.vendors.add(vendor);
      set((s) => ({ vendors: [...s.vendors, vendor] }));
      addToSyncQueue({ table: 'vendors', operation: 'insert', data: vendor as unknown as Record<string, unknown> });
    } catch (error) {
      console.error('Failed to add vendor:', error);
      throw error;
    }
  },

  updateVendor: async (id, updates) => {
    try {
      await db.vendors.update(id, updates);
      set((s) => ({
        vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      }));
      const vendor = get().vendors.find((v) => v.id === id);
      if (vendor) addToSyncQueue({ table: 'vendors', operation: 'update', data: { ...vendor, ...updates } as unknown as Record<string, unknown> });
    } catch (error) {
      console.error('Failed to update vendor:', error);
      throw error;
    }
  },

  deleteVendor: async (id) => {
    try {
      await db.vendors.delete(id);
      set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) }));
      addToSyncQueue({ table: 'vendors', operation: 'delete', data: { id } });
    } catch (error) {
      console.error('Failed to delete vendor:', error);
      throw error;
    }
  },

  setFilter: (filter) => set((s) => ({ filter: { ...s.filter, ...filter } })),

  getFilteredVendors: () => {
    const { vendors, filter } = get();
    return vendors.filter((v) => {
      if (filter.category !== 'all' && v.category !== filter.category) return false;
      if (filter.search && !v.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  },

  getTotalCost: () => get().vendors.reduce((sum, v) => sum + v.total_cost, 0),
  getTotalDeposits: () => get().vendors.reduce((sum, v) => sum + v.deposit_paid, 0),
}));
