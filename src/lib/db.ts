import Dexie, { type Table } from 'dexie';
import type {
  Wedding,
  Task,
  BudgetCategory,
  BudgetItem,
  Guest,
  Vendor,
  SeatingTable,
  TimelineEvent,
  MoodBoardItem,
  Note,
  ChatMessage,
  Activity,
} from '@/types';

export interface SyncQueueEntry {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
}

export class WeddingPlannerDB extends Dexie {
  weddings!: Table<Wedding>;
  tasks!: Table<Task>;
  budgetCategories!: Table<BudgetCategory>;
  budgetItems!: Table<BudgetItem>;
  guests!: Table<Guest>;
  vendors!: Table<Vendor>;
  seatingTables!: Table<SeatingTable>;
  timelineEvents!: Table<TimelineEvent>;
  moodBoardItems!: Table<MoodBoardItem>;
  notes!: Table<Note>;
  messages!: Table<ChatMessage>;
  activities!: Table<Activity>;
  syncQueue!: Table<SyncQueueEntry>;

  constructor() {
    super('WeddingPlannerDB');

    // Version 2 — original schema (kept for existing users)
    this.version(2).stores({
      weddings: 'id, user_id, created_at',
      tasks: 'id, wedding_id, status, category, due_date, priority',
      budgetCategories: 'id, wedding_id',
      budgetItems: 'id, category_id, wedding_id, payment_status',
      guests: 'id, wedding_id, group, rsvp_status, table_id',
      vendors: 'id, wedding_id, category',
      seatingTables: 'id, wedding_id',
      timelineEvents: 'id, wedding_id, sort_order',
      moodBoardItems: 'id, wedding_id, category',
      notes: 'id, wedding_id, author_id, vendor_id',
      messages: 'id, wedding_id, user_id, created_at',
      activities: 'id, wedding_id, user_id, created_at',
    });

    // Version 3 — adds persistent sync queue
    this.version(3).stores({
      weddings: 'id, user_id, created_at',
      tasks: 'id, wedding_id, status, category, due_date, priority',
      budgetCategories: 'id, wedding_id',
      budgetItems: 'id, category_id, wedding_id, payment_status',
      guests: 'id, wedding_id, group, rsvp_status, table_id',
      vendors: 'id, wedding_id, category',
      seatingTables: 'id, wedding_id',
      timelineEvents: 'id, wedding_id, sort_order',
      moodBoardItems: 'id, wedding_id, category',
      notes: 'id, wedding_id, author_id, vendor_id',
      messages: 'id, wedding_id, user_id, created_at',
      activities: 'id, wedding_id, user_id, created_at',
      syncQueue: 'id, table, timestamp',
    });

    // Version 4 — enhanced chat (reply_to index)
    this.version(4).stores({
      weddings: 'id, user_id, created_at',
      tasks: 'id, wedding_id, status, category, due_date, priority',
      budgetCategories: 'id, wedding_id',
      budgetItems: 'id, category_id, wedding_id, payment_status',
      guests: 'id, wedding_id, group, rsvp_status, table_id',
      vendors: 'id, wedding_id, category',
      seatingTables: 'id, wedding_id',
      timelineEvents: 'id, wedding_id, sort_order',
      moodBoardItems: 'id, wedding_id, category',
      notes: 'id, wedding_id, author_id, vendor_id',
      messages: 'id, wedding_id, user_id, created_at, reply_to',
      activities: 'id, wedding_id, user_id, created_at',
      syncQueue: 'id, table, timestamp',
    });
  }
}

export const db = new WeddingPlannerDB();
export default db;
