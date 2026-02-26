// ============================================================
// Budget Store — Full CRUD + Computed Values Tests
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBudgetStore } from '@/stores/budgetStore';
import type { BudgetCategory, BudgetItem } from '@/types';

// Mock Dexie
vi.mock('@/lib/db', () => ({
  db: {
    budgetCategories: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
      add: vi.fn().mockResolvedValue('id'),
      update: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    budgetItems: {
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
  generateId: vi.fn().mockReturnValue('test-budget-id'),
}));

function createCategory(overrides: Partial<BudgetCategory> = {}): BudgetCategory {
  return {
    id: 'cat-1',
    wedding_id: 'wedding-1',
    name: 'Venue',
    allocated_amount: 5000,
    icon: '🏛️',
    ...overrides,
  };
}

function createItem(overrides: Partial<BudgetItem> = {}): BudgetItem {
  return {
    id: 'item-1',
    category_id: 'cat-1',
    wedding_id: 'wedding-1',
    name: 'Reception Hall',
    estimated_cost: 3000,
    actual_cost: 2800,
    payment_status: 'deposit-paid',
    vendor_id: null,
    notes: '',
    ...overrides,
  };
}

describe('useBudgetStore', () => {
  beforeEach(() => {
    useBudgetStore.setState({
      categories: [],
      items: [],
      isLoading: false,
    });
  });

  // ---- Initial State ----
  describe('initial state', () => {
    it('starts with empty categories and items', () => {
      const state = useBudgetStore.getState();
      expect(state.categories).toEqual([]);
      expect(state.items).toEqual([]);
    });

    it('starts with isLoading false', () => {
      expect(useBudgetStore.getState().isLoading).toBe(false);
    });
  });

  // ---- addCategory ----
  describe('addCategory', () => {
    it('adds category to store', async () => {
      await useBudgetStore.getState().addCategory({
        wedding_id: 'wedding-1',
        name: 'Photography',
        allocated_amount: 3000,
        icon: '📷',
      });
      expect(useBudgetStore.getState().categories).toHaveLength(1);
      expect(useBudgetStore.getState().categories[0]?.name).toBe('Photography');
    });

    it('generates an ID', async () => {
      await useBudgetStore.getState().addCategory({
        wedding_id: 'wedding-1',
        name: 'Test',
        allocated_amount: 0,
        icon: '',
      });
      expect(useBudgetStore.getState().categories[0]?.id).toBe('test-budget-id');
    });
  });

  // ---- updateCategory ----
  describe('updateCategory', () => {
    it('updates category in store', async () => {
      useBudgetStore.setState({ categories: [createCategory()] });
      await useBudgetStore.getState().updateCategory('cat-1', { allocated_amount: 7000 });
      expect(useBudgetStore.getState().categories[0]?.allocated_amount).toBe(7000);
    });
  });

  // ---- deleteCategory ----
  describe('deleteCategory', () => {
    it('removes category from store', async () => {
      useBudgetStore.setState({ categories: [createCategory()] });
      await useBudgetStore.getState().deleteCategory('cat-1');
      expect(useBudgetStore.getState().categories).toHaveLength(0);
    });

    it('removes child items when deleting category', async () => {
      useBudgetStore.setState({
        categories: [createCategory()],
        items: [createItem(), createItem({ id: 'item-2', name: 'DJ' })],
      });
      await useBudgetStore.getState().deleteCategory('cat-1');
      expect(useBudgetStore.getState().items).toHaveLength(0);
    });

    it('preserves items from other categories', async () => {
      useBudgetStore.setState({
        categories: [createCategory(), createCategory({ id: 'cat-2', name: 'Music' })],
        items: [
          createItem(),
          createItem({ id: 'item-2', category_id: 'cat-2', name: 'DJ' }),
        ],
      });
      await useBudgetStore.getState().deleteCategory('cat-1');
      expect(useBudgetStore.getState().items).toHaveLength(1);
      expect(useBudgetStore.getState().items[0]?.name).toBe('DJ');
    });
  });

  // ---- addItem ----
  describe('addItem', () => {
    it('adds item to store', async () => {
      await useBudgetStore.getState().addItem({
        category_id: 'cat-1',
        wedding_id: 'wedding-1',
        name: 'Flowers',
        estimated_cost: 500,
        actual_cost: 0,
        payment_status: 'pending',
        vendor_id: null,
        notes: '',
      });
      expect(useBudgetStore.getState().items).toHaveLength(1);
    });
  });

  // ---- updateItem ----
  describe('updateItem', () => {
    it('updates item in store', async () => {
      useBudgetStore.setState({ items: [createItem()] });
      await useBudgetStore.getState().updateItem('item-1', { actual_cost: 3200 });
      expect(useBudgetStore.getState().items[0]?.actual_cost).toBe(3200);
    });
  });

  // ---- deleteItem ----
  describe('deleteItem', () => {
    it('removes item from store', async () => {
      useBudgetStore.setState({ items: [createItem()] });
      await useBudgetStore.getState().deleteItem('item-1');
      expect(useBudgetStore.getState().items).toHaveLength(0);
    });
  });

  // ---- Computed Values ----
  describe('getTotalAllocated', () => {
    it('sums category allocated amounts', () => {
      useBudgetStore.setState({
        categories: [
          createCategory({ allocated_amount: 5000 }),
          createCategory({ id: 'cat-2', allocated_amount: 3000 }),
        ],
      });
      expect(useBudgetStore.getState().getTotalAllocated()).toBe(8000);
    });

    it('returns 0 when no categories', () => {
      expect(useBudgetStore.getState().getTotalAllocated()).toBe(0);
    });
  });

  describe('getTotalEstimated', () => {
    it('sums item estimated costs', () => {
      useBudgetStore.setState({
        items: [
          createItem({ estimated_cost: 3000 }),
          createItem({ id: 'item-2', estimated_cost: 2000 }),
        ],
      });
      expect(useBudgetStore.getState().getTotalEstimated()).toBe(5000);
    });

    it('returns 0 when no items', () => {
      expect(useBudgetStore.getState().getTotalEstimated()).toBe(0);
    });
  });

  describe('getTotalActual', () => {
    it('sums item actual costs', () => {
      useBudgetStore.setState({
        items: [
          createItem({ actual_cost: 2800 }),
          createItem({ id: 'item-2', actual_cost: 1500 }),
        ],
      });
      expect(useBudgetStore.getState().getTotalActual()).toBe(4300);
    });
  });

  describe('getItemsByCategory', () => {
    it('filters items by category ID', () => {
      useBudgetStore.setState({
        items: [
          createItem({ category_id: 'cat-1' }),
          createItem({ id: 'item-2', category_id: 'cat-2', name: 'Other' }),
          createItem({ id: 'item-3', category_id: 'cat-1', name: 'Also Venue' }),
        ],
      });
      const result = useBudgetStore.getState().getItemsByCategory('cat-1');
      expect(result).toHaveLength(2);
    });

    it('returns empty array for unknown category', () => {
      useBudgetStore.setState({ items: [createItem()] });
      expect(useBudgetStore.getState().getItemsByCategory('nonexistent')).toHaveLength(0);
    });
  });
});
