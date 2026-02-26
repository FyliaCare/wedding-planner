import { create } from 'zustand';
import type { BudgetCategory, BudgetItem } from '@/types';
import { db } from '@/lib/db';
import { addToSyncQueue } from '@/lib/sync';
import { generateId } from '@/utils';

interface BudgetState {
  categories: BudgetCategory[];
  items: BudgetItem[];
  isLoading: boolean;

  loadBudget: (weddingId: string) => Promise<void>;
  addCategory: (cat: Omit<BudgetCategory, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<BudgetCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addItem: (item: Omit<BudgetItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<BudgetItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getTotalAllocated: () => number;
  getTotalEstimated: () => number;
  getTotalActual: () => number;
  getItemsByCategory: (categoryId: string) => BudgetItem[];
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  categories: [],
  items: [],
  isLoading: false,

  loadBudget: async (weddingId) => {
    set({ isLoading: true });
    try {
      const [categories, items] = await Promise.all([
        db.budgetCategories.where('wedding_id').equals(weddingId).toArray(),
        db.budgetItems.where('wedding_id').equals(weddingId).toArray(),
      ]);
      set({ categories, items });
    } catch (error) {
      console.error('Failed to load budget:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addCategory: async (catData) => {
    const cat: BudgetCategory = { ...catData, id: generateId() };
    try {
      await db.budgetCategories.add(cat);
      set((s) => ({ categories: [...s.categories, cat] }));
      addToSyncQueue({ table: 'budget_categories', operation: 'insert', data: cat as unknown as Record<string, unknown> });
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  },

  updateCategory: async (id, updates) => {
    try {
      await db.budgetCategories.update(id, updates);
      set((s) => ({
        categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
      const cat = get().categories.find((c) => c.id === id);
      if (cat) addToSyncQueue({ table: 'budget_categories', operation: 'update', data: { ...cat, ...updates } as unknown as Record<string, unknown> });
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      // Also delete items in this category
      const items = get().items.filter((i) => i.category_id === id);
      for (const item of items) {
        await db.budgetItems.delete(item.id);
        addToSyncQueue({ table: 'budget_items', operation: 'delete', data: { id: item.id } });
      }
      await db.budgetCategories.delete(id);
      set((s) => ({
        categories: s.categories.filter((c) => c.id !== id),
        items: s.items.filter((i) => i.category_id !== id),
      }));
      addToSyncQueue({ table: 'budget_categories', operation: 'delete', data: { id } });
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  },

  addItem: async (itemData) => {
    const item: BudgetItem = { ...itemData, id: generateId() };
    try {
      await db.budgetItems.add(item);
      set((s) => ({ items: [...s.items, item] }));
      addToSyncQueue({ table: 'budget_items', operation: 'insert', data: item as unknown as Record<string, unknown> });
    } catch (error) {
      console.error('Failed to add budget item:', error);
      throw error;
    }
  },

  updateItem: async (id, updates) => {
    try {
      await db.budgetItems.update(id, updates);
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      }));
      const item = get().items.find((i) => i.id === id);
      if (item) addToSyncQueue({ table: 'budget_items', operation: 'update', data: { ...item, ...updates } as unknown as Record<string, unknown> });
    } catch (error) {
      console.error('Failed to update budget item:', error);
      throw error;
    }
  },

  deleteItem: async (id) => {
    try {
      await db.budgetItems.delete(id);
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      addToSyncQueue({ table: 'budget_items', operation: 'delete', data: { id } });
    } catch (error) {
      console.error('Failed to delete budget item:', error);
      throw error;
    }
  },

  getTotalAllocated: () => get().categories.reduce((sum, c) => sum + c.allocated_amount, 0),
  getTotalEstimated: () => get().items.reduce((sum, i) => sum + i.estimated_cost, 0),
  getTotalActual: () => get().items.reduce((sum, i) => sum + i.actual_cost, 0),
  getItemsByCategory: (categoryId) => get().items.filter((i) => i.category_id === categoryId),
}));
