// ============================================================
// Vendor Store — Full CRUD + Filtering + Computed Tests
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVendorStore } from '@/stores/vendorStore';
import type { Vendor } from '@/types';

vi.mock('@/lib/db', () => ({
  db: {
    vendors: {
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
  generateId: vi.fn().mockReturnValue('test-vendor-id'),
}));

function createVendor(overrides: Partial<Vendor> = {}): Vendor {
  return {
    id: 'vendor-1',
    wedding_id: 'wedding-1',
    name: 'Grand Ballroom',
    category: 'venue',
    email: 'info@grand.com',
    phone: '555-0200',
    website: 'https://grand.com',
    contract_url: null,
    total_cost: 10000,
    deposit_paid: 2500,
    rating: 4,
    notes: '',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('useVendorStore', () => {
  beforeEach(() => {
    useVendorStore.setState({
      vendors: [],
      isLoading: false,
      filter: { category: 'all', search: '' },
    });
  });

  // ---- CRUD ----
  describe('addVendor', () => {
    it('adds vendor to store', async () => {
      await useVendorStore.getState().addVendor({
        wedding_id: 'wedding-1',
        name: 'Photo Studio',
        category: 'photography',
        email: '',
        phone: '',
        website: '',
        contract_url: null,
        total_cost: 3000,
        deposit_paid: 500,
        rating: 5,
        notes: '',
      });
      expect(useVendorStore.getState().vendors).toHaveLength(1);
    });
  });

  describe('updateVendor', () => {
    it('updates vendor in store', async () => {
      useVendorStore.setState({ vendors: [createVendor()] });
      await useVendorStore.getState().updateVendor('vendor-1', { rating: 5 });
      expect(useVendorStore.getState().vendors[0]?.rating).toBe(5);
    });
  });

  describe('deleteVendor', () => {
    it('removes vendor from store', async () => {
      useVendorStore.setState({ vendors: [createVendor()] });
      await useVendorStore.getState().deleteVendor('vendor-1');
      expect(useVendorStore.getState().vendors).toHaveLength(0);
    });
  });

  // ---- Filtering ----
  describe('getFilteredVendors', () => {
    const vendors: Vendor[] = [
      createVendor({ id: '1', name: 'Grand Ballroom', category: 'venue' }),
      createVendor({ id: '2', name: 'Photo Pro', category: 'photography' }),
      createVendor({ id: '3', name: 'DJ Mike', category: 'music-dj' }),
    ];

    beforeEach(() => {
      useVendorStore.setState({ vendors });
    });

    it('returns all when no filters', () => {
      expect(useVendorStore.getState().getFilteredVendors()).toHaveLength(3);
    });

    it('filters by category', () => {
      useVendorStore.getState().setFilter({ category: 'photography' });
      expect(useVendorStore.getState().getFilteredVendors()).toHaveLength(1);
    });

    it('filters by search (case-insensitive)', () => {
      useVendorStore.getState().setFilter({ search: 'grand' });
      expect(useVendorStore.getState().getFilteredVendors()).toHaveLength(1);
    });

    it('combines category + search', () => {
      useVendorStore.getState().setFilter({ category: 'venue', search: 'grand' });
      expect(useVendorStore.getState().getFilteredVendors()).toHaveLength(1);
    });

    it('returns empty for no matches', () => {
      useVendorStore.getState().setFilter({ search: 'zzz' });
      expect(useVendorStore.getState().getFilteredVendors()).toHaveLength(0);
    });
  });

  // ---- Computed Values ----
  describe('getTotalCost', () => {
    it('sums all vendor costs', () => {
      useVendorStore.setState({
        vendors: [
          createVendor({ total_cost: 10000 }),
          createVendor({ id: '2', total_cost: 3000 }),
        ],
      });
      expect(useVendorStore.getState().getTotalCost()).toBe(13000);
    });

    it('returns 0 for no vendors', () => {
      expect(useVendorStore.getState().getTotalCost()).toBe(0);
    });
  });

  describe('getTotalDeposits', () => {
    it('sums all deposits paid', () => {
      useVendorStore.setState({
        vendors: [
          createVendor({ deposit_paid: 2500 }),
          createVendor({ id: '2', deposit_paid: 500 }),
        ],
      });
      expect(useVendorStore.getState().getTotalDeposits()).toBe(3000);
    });

    it('returns 0 for no vendors', () => {
      expect(useVendorStore.getState().getTotalDeposits()).toBe(0);
    });
  });
});
