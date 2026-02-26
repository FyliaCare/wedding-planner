// ============================================================
// Dexie Database Schema Tests
// ============================================================
import { describe, it, expect, beforeAll } from 'vitest';
import 'fake-indexeddb/auto';

// We import the actual DB to test its schema
import { WeddingPlannerDB } from '@/lib/db';
import type { SyncQueueEntry } from '@/lib/db';

describe('WeddingPlannerDB Schema', () => {
  let testDb: WeddingPlannerDB;

  beforeAll(() => {
    // Create a separate test instance to avoid conflicts
    testDb = new WeddingPlannerDB();
  });

  it('has version 4', () => {
    expect(testDb.verno).toBe(4);
  });

  it('has 13 tables', () => {
    const tableNames = testDb.tables.map((t) => t.name).sort();
    expect(tableNames).toEqual([
      'activities',
      'budgetCategories',
      'budgetItems',
      'guests',
      'messages',
      'moodBoardItems',
      'notes',
      'seatingTables',
      'syncQueue',
      'tasks',
      'timelineEvents',
      'vendors',
      'weddings',
    ]);
  });

  describe('table existence', () => {
    const expectedTables = [
      'weddings', 'tasks', 'budgetCategories', 'budgetItems',
      'guests', 'vendors', 'seatingTables', 'timelineEvents',
      'moodBoardItems', 'notes', 'messages', 'activities', 'syncQueue',
    ];

    expectedTables.forEach((tableName) => {
      it(`has ${tableName} table`, () => {
        const table = testDb.tables.find((t) => t.name === tableName);
        expect(table).toBeDefined();
      });
    });
  });

  describe('SyncQueueEntry type', () => {
    it('accepts valid sync queue entry', () => {
      const entry: SyncQueueEntry = {
        id: '1',
        table: 'tasks',
        operation: 'insert',
        data: { id: '1', title: 'Test' },
        timestamp: Date.now(),
      };
      expect(entry.operation).toBe('insert');
    });

    it('accepts all operation types', () => {
      const ops: SyncQueueEntry['operation'][] = ['insert', 'update', 'delete'];
      expect(ops).toHaveLength(3);
    });
  });
});
