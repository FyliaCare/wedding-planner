import { create } from 'zustand';
import type { Task, TaskStatus, TaskCategory } from '@/types';
import { db } from '@/lib/db';
import { addToSyncQueue } from '@/lib/sync';
import { generateId } from '@/utils';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  filter: {
    status: TaskStatus | 'all';
    category: TaskCategory | 'all';
    search: string;
  };

  loadTasks: (weddingId: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'created_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilter: (filter: Partial<TaskState['filter']>) => void;
  getFilteredTasks: () => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  filter: { status: 'all', category: 'all', search: '' },

  loadTasks: async (weddingId) => {
    set({ isLoading: true });
    try {
      const tasks = await db.tasks.where('wedding_id').equals(weddingId).toArray();
      set({ tasks });
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async (taskData) => {
    const task: Task = {
      ...taskData,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    try {
      await db.tasks.add(task);
      set((state) => ({ tasks: [...state.tasks, task] }));
      addToSyncQueue({ table: 'tasks', operation: 'insert', data: task as unknown as Record<string, unknown> });
    } catch (error) {
      console.error('Failed to add task:', error);
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    try {
      await db.tasks.update(id, updates);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
      const task = get().tasks.find((t) => t.id === id);
      if (task) {
        addToSyncQueue({ table: 'tasks', operation: 'update', data: { ...task, ...updates } as unknown as Record<string, unknown> });
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      await db.tasks.delete(id);
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      addToSyncQueue({ table: 'tasks', operation: 'delete', data: { id } });
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  },

  setFilter: (filter) =>
    set((state) => ({ filter: { ...state.filter, ...filter } })),

  getFilteredTasks: () => {
    const { tasks, filter } = get();
    return tasks.filter((t) => {
      if (filter.status !== 'all' && t.status !== filter.status) return false;
      if (filter.category !== 'all' && t.category !== filter.category) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  },
}));
