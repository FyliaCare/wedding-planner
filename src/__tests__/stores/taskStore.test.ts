// ============================================================
// Task Store — Full CRUD + Filtering Tests
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskStore } from '@/stores/taskStore';
import type { Task, TaskCategory, TaskPriority, TaskStatus } from '@/types';

// Mock Dexie
const mockTasks: Task[] = [];
vi.mock('@/lib/db', () => ({
  db: {
    tasks: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockImplementation(() => ({
          toArray: vi.fn().mockImplementation(() => Promise.resolve([...mockTasks])),
        })),
      }),
      add: vi.fn().mockImplementation((task: Task) => {
        mockTasks.push(task);
        return Promise.resolve(task.id);
      }),
      update: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock('@/lib/sync', () => ({
  addToSyncQueue: vi.fn(),
}));

vi.mock('@/utils', () => ({
  generateId: vi.fn().mockReturnValue('test-task-id'),
}));

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    wedding_id: 'wedding-1',
    title: 'Book photographer',
    description: 'Find and book a wedding photographer',
    category: 'photography' as TaskCategory,
    due_date: '2025-06-01',
    assigned_to: null,
    priority: 'high' as TaskPriority,
    status: 'todo' as TaskStatus,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('useTaskStore', () => {
  beforeEach(() => {
    mockTasks.length = 0;
    useTaskStore.setState({
      tasks: [],
      isLoading: false,
      filter: { status: 'all', category: 'all', search: '' },
    });
  });

  // ---- Initial State ----
  describe('initial state', () => {
    it('starts with empty tasks array', () => {
      expect(useTaskStore.getState().tasks).toEqual([]);
    });

    it('starts with isLoading false', () => {
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('starts with default filter (all/all/empty)', () => {
      expect(useTaskStore.getState().filter).toEqual({
        status: 'all',
        category: 'all',
        search: '',
      });
    });
  });

  // ---- loadTasks ----
  describe('loadTasks', () => {
    it('sets isLoading to true then false', async () => {
      const stateChanges: boolean[] = [];
      useTaskStore.subscribe((s) => stateChanges.push(s.isLoading));
      await useTaskStore.getState().loadTasks('wedding-1');
      expect(stateChanges).toContain(true);
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('loads tasks into state', async () => {
      mockTasks.push(createTask(), createTask({ id: 'task-2', title: 'Book venue' }));
      await useTaskStore.getState().loadTasks('wedding-1');
      expect(useTaskStore.getState().tasks).toHaveLength(2);
    });
  });

  // ---- addTask ----
  describe('addTask', () => {
    it('adds task to store state', async () => {
      const { addTask } = useTaskStore.getState();
      await addTask({
        wedding_id: 'wedding-1',
        title: 'Book DJ',
        description: 'Find a DJ',
        category: 'music',
        due_date: '2025-07-01',
        assigned_to: null,
        priority: 'medium',
        status: 'todo',
      });
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0]?.title).toBe('Book DJ');
    });

    it('generates an ID for the new task', async () => {
      const { addTask } = useTaskStore.getState();
      await addTask({
        wedding_id: 'wedding-1',
        title: 'Test Task',
        description: '',
        category: 'other',
        due_date: null,
        assigned_to: null,
        priority: 'low',
        status: 'todo',
      });
      expect(useTaskStore.getState().tasks[0]?.id).toBe('test-task-id');
    });

    it('calls addToSyncQueue', async () => {
      const { addToSyncQueue } = await import('@/lib/sync');
      const { addTask } = useTaskStore.getState();
      await addTask({
        wedding_id: 'wedding-1',
        title: 'Sync Test',
        description: '',
        category: 'other',
        due_date: null,
        assigned_to: null,
        priority: 'low',
        status: 'todo',
      });
      expect(addToSyncQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          table: 'tasks',
          operation: 'insert',
        })
      );
    });
  });

  // ---- updateTask ----
  describe('updateTask', () => {
    it('updates task in store state', async () => {
      useTaskStore.setState({ tasks: [createTask()] });
      await useTaskStore.getState().updateTask('task-1', { status: 'done' });
      expect(useTaskStore.getState().tasks[0]?.status).toBe('done');
    });

    it('only updates the targeted task', async () => {
      useTaskStore.setState({
        tasks: [createTask(), createTask({ id: 'task-2', title: 'Other task' })],
      });
      await useTaskStore.getState().updateTask('task-1', { title: 'Updated' });
      expect(useTaskStore.getState().tasks[0]?.title).toBe('Updated');
      expect(useTaskStore.getState().tasks[1]?.title).toBe('Other task');
    });
  });

  // ---- deleteTask ----
  describe('deleteTask', () => {
    it('removes task from store', async () => {
      useTaskStore.setState({ tasks: [createTask()] });
      await useTaskStore.getState().deleteTask('task-1');
      expect(useTaskStore.getState().tasks).toHaveLength(0);
    });

    it('keeps other tasks intact', async () => {
      useTaskStore.setState({
        tasks: [createTask(), createTask({ id: 'task-2', title: 'Keep me' })],
      });
      await useTaskStore.getState().deleteTask('task-1');
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0]?.title).toBe('Keep me');
    });
  });

  // ---- setFilter ----
  describe('setFilter', () => {
    it('sets status filter', () => {
      useTaskStore.getState().setFilter({ status: 'done' });
      expect(useTaskStore.getState().filter.status).toBe('done');
    });

    it('sets category filter', () => {
      useTaskStore.getState().setFilter({ category: 'venue' });
      expect(useTaskStore.getState().filter.category).toBe('venue');
    });

    it('sets search filter', () => {
      useTaskStore.getState().setFilter({ search: 'photographer' });
      expect(useTaskStore.getState().filter.search).toBe('photographer');
    });

    it('merges partial filter without erasing others', () => {
      useTaskStore.getState().setFilter({ status: 'done' });
      useTaskStore.getState().setFilter({ search: 'test' });
      expect(useTaskStore.getState().filter).toEqual({
        status: 'done',
        category: 'all',
        search: 'test',
      });
    });
  });

  // ---- getFilteredTasks ----
  describe('getFilteredTasks', () => {
    const tasks: Task[] = [
      createTask({ id: '1', title: 'Book photographer', status: 'todo', category: 'photography', description: 'Capture the memories' }),
      createTask({ id: '2', title: 'Find venue', status: 'in-progress', category: 'venue', description: 'Search for locations' }),
      createTask({ id: '3', title: 'Buy dress', status: 'done', category: 'attire', description: 'Pick a gown' }),
      createTask({ id: '4', title: 'Book flowers', status: 'todo', category: 'flowers', description: 'Rose bouquet' }),
    ];

    beforeEach(() => {
      useTaskStore.setState({ tasks });
    });

    it('returns all tasks when no filters', () => {
      expect(useTaskStore.getState().getFilteredTasks()).toHaveLength(4);
    });

    it('filters by status', () => {
      useTaskStore.getState().setFilter({ status: 'todo' });
      expect(useTaskStore.getState().getFilteredTasks()).toHaveLength(2);
    });

    it('filters by category', () => {
      useTaskStore.getState().setFilter({ category: 'photography' });
      expect(useTaskStore.getState().getFilteredTasks()).toHaveLength(1);
    });

    it('filters by search (title match)', () => {
      useTaskStore.getState().setFilter({ search: 'book' });
      const filtered = useTaskStore.getState().getFilteredTasks();
      expect(filtered).toHaveLength(2);
    });

    it('filters by search (description match)', () => {
      useTaskStore.getState().setFilter({ search: 'rose' });
      const filtered = useTaskStore.getState().getFilteredTasks();
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.title).toBe('Book flowers');
    });

    it('combines multiple filters', () => {
      useTaskStore.getState().setFilter({ status: 'todo', search: 'book' });
      const filtered = useTaskStore.getState().getFilteredTasks();
      expect(filtered).toHaveLength(2);
    });

    it('returns empty for unmatched filters', () => {
      useTaskStore.getState().setFilter({ search: 'nonexistent' });
      expect(useTaskStore.getState().getFilteredTasks()).toHaveLength(0);
    });

    it('search is case-insensitive', () => {
      useTaskStore.getState().setFilter({ search: 'PHOTOGRAPHER' });
      expect(useTaskStore.getState().getFilteredTasks()).toHaveLength(1);
    });
  });
});
