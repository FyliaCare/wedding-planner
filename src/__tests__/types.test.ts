// ============================================================
// Type Definitions Tests — Structural Validation
// ============================================================
import { describe, it, expect } from 'vitest';
import type {
  User,
  Wedding,
  Task,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  BudgetCategory,
  BudgetItem,
  PaymentStatus,
  Guest,
  RSVPStatus,
  MealPreference,
  GuestGroup,
  VendorCategory,
  SeatingTable,
  TableShape,
  MoodBoardCategory,
  ChatMessage,
  Activity,
  DashboardStats,
} from '@/types';

describe('Type Definitions', () => {
  // These tests validate that types compile correctly and objects conforming
  // to the interfaces can be created with all required fields.

  describe('User', () => {
    it('accepts a valid user object', () => {
      const user: User = {
        id: '1',
        email: 'test@test.com',
        name: 'Janet',
        avatar_url: null,
        role: 'couple',
        created_at: '2025-01-01',
      };
      expect(user.role).toBe('couple');
    });

    it('accepts all role types', () => {
      const roles: User['role'][] = ['couple', 'planner', 'guest'];
      expect(roles).toHaveLength(3);
    });

    it('allows optional location and relationship fields', () => {
      const user: User = {
        id: '1',
        email: '',
        name: 'Janet',
        avatar_url: null,
        role: 'couple',
        location: 'London',
        relationship: 'bride',
        created_at: '2025-01-01',
      };
      expect(user.location).toBe('London');
    });
  });

  describe('Wedding', () => {
    it('accepts a valid wedding object', () => {
      const wedding: Wedding = {
        id: '1',
        user_id: '1',
        partner1_name: 'Janet',
        partner2_name: 'Jojo',
        wedding_date: '2025-12-20',
        venue: 'Rose Garden',
        location: 'London',
        theme: 'romantic',
        total_budget: 50000,
        cover_image_url: null,
        created_at: '2025-01-01',
      };
      expect(wedding.partner1_name).toBe('Janet');
    });
  });

  describe('Task types', () => {
    it('validates TaskStatus enumeration', () => {
      const statuses: TaskStatus[] = ['todo', 'in-progress', 'done'];
      expect(statuses).toHaveLength(3);
    });

    it('validates TaskPriority enumeration', () => {
      const priorities: TaskPriority[] = ['low', 'medium', 'high'];
      expect(priorities).toHaveLength(3);
    });

    it('validates TaskCategory enumeration', () => {
      const categories: TaskCategory[] = [
        'venue', 'catering', 'photography', 'music', 'flowers',
        'attire', 'invitations', 'transportation', 'accommodation',
        'legal', 'other',
      ];
      expect(categories).toHaveLength(11);
    });

    it('accepts a valid task', () => {
      const task: Task = {
        id: '1',
        wedding_id: '1',
        title: 'Book photographer',
        description: '',
        category: 'photography',
        due_date: null,
        assigned_to: null,
        priority: 'high',
        status: 'todo',
        created_at: '2025-01-01',
      };
      expect(task.status).toBe('todo');
    });
  });

  describe('Budget types', () => {
    it('validates PaymentStatus', () => {
      const statuses: PaymentStatus[] = ['pending', 'deposit-paid', 'fully-paid'];
      expect(statuses).toHaveLength(3);
    });

    it('accepts valid budget category', () => {
      const cat: BudgetCategory = {
        id: '1',
        wedding_id: '1',
        name: 'Venue',
        allocated_amount: 5000,
        icon: '🏛️',
      };
      expect(cat.allocated_amount).toBe(5000);
    });

    it('accepts valid budget item', () => {
      const item: BudgetItem = {
        id: '1',
        category_id: '1',
        wedding_id: '1',
        name: 'Hall Deposit',
        estimated_cost: 3000,
        actual_cost: 2800,
        payment_status: 'deposit-paid',
        vendor_id: null,
        notes: '',
      };
      expect(item.payment_status).toBe('deposit-paid');
    });
  });

  describe('Guest types', () => {
    it('validates RSVPStatus', () => {
      const statuses: RSVPStatus[] = ['invited', 'sent', 'accepted', 'declined', 'pending'];
      expect(statuses).toHaveLength(5);
    });

    it('validates MealPreference', () => {
      const prefs: MealPreference[] = [
        'standard', 'vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'other',
      ];
      expect(prefs).toHaveLength(7);
    });

    it('validates GuestGroup', () => {
      const groups: GuestGroup[] = [
        'bride-family', 'groom-family', 'bride-friends', 'groom-friends', 'work', 'other',
      ];
      expect(groups).toHaveLength(6);
    });

    it('accepts valid guest', () => {
      const guest: Guest = {
        id: '1',
        wedding_id: '1',
        name: 'Aunt Mary',
        email: 'mary@test.com',
        phone: '',
        group: 'bride-family',
        meal_preference: 'standard',
        dietary_restrictions: '',
        plus_one: true,
        plus_one_name: 'Uncle Bob',
        rsvp_status: 'accepted',
        table_id: null,
        seat_number: null,
        notes: '',
        created_at: '2025-01-01',
      };
      expect(guest.plus_one).toBe(true);
    });
  });

  describe('Vendor types', () => {
    it('validates VendorCategory', () => {
      const categories: VendorCategory[] = [
        'venue', 'catering', 'photography', 'videography', 'florist',
        'music-dj', 'music-band', 'cake', 'hair-makeup', 'transportation',
        'stationery', 'rentals', 'planner', 'officiant', 'other',
      ];
      expect(categories).toHaveLength(15);
    });
  });

  describe('Seating types', () => {
    it('validates TableShape', () => {
      const shapes: TableShape[] = ['round', 'rectangular', 'square'];
      expect(shapes).toHaveLength(3);
    });

    it('accepts valid seating table', () => {
      const table: SeatingTable = {
        id: '1',
        wedding_id: '1',
        name: 'Table 1',
        shape: 'round',
        capacity: 10,
        position_x: 100,
        position_y: 200,
      };
      expect(table.shape).toBe('round');
    });
  });

  describe('MoodBoard types', () => {
    it('validates MoodBoardCategory', () => {
      const categories: MoodBoardCategory[] = [
        'decor', 'dress', 'flowers', 'cake', 'venue', 'hair-makeup', 'invitations', 'other',
      ];
      expect(categories).toHaveLength(8);
    });
  });

  describe('Chat types', () => {
    it('accepts valid message with reactions', () => {
      const msg: ChatMessage = {
        id: '1',
        wedding_id: '1',
        user_id: '1',
        user_name: 'Janet',
        user_avatar: null,
        content: 'Hello!',
        type: 'message',
        reply_to: null,
        reactions: { '❤️': ['user-1', 'user-2'] },
        image_url: null,
        is_deleted: false,
        created_at: '2025-01-01',
      };
      expect(msg.reactions['❤️']).toHaveLength(2);
    });

    it('validates message types', () => {
      const types: ChatMessage['type'][] = ['message', 'update', 'photo', 'emoji'];
      expect(types).toHaveLength(4);
    });

    it('accepts emoji-only message', () => {
      const msg: ChatMessage = {
        id: '1',
        wedding_id: '1',
        user_id: '1',
        user_name: 'Janet',
        user_avatar: null,
        content: '❤️',
        type: 'emoji',
        reply_to: null,
        reactions: {},
        image_url: null,
        is_deleted: false,
        created_at: '2025-01-01',
      };
      expect(msg.type).toBe('emoji');
    });

    it('accepts deleted message', () => {
      const msg: ChatMessage = {
        id: '1',
        wedding_id: '1',
        user_id: '1',
        user_name: 'Janet',
        user_avatar: null,
        content: '',
        type: 'message',
        reply_to: null,
        reactions: {},
        image_url: null,
        is_deleted: true,
        created_at: '2025-01-01',
      };
      expect(msg.is_deleted).toBe(true);
    });

    it('accepts reply message', () => {
      const msg: ChatMessage = {
        id: '2',
        wedding_id: '1',
        user_id: '1',
        user_name: 'Janet',
        user_avatar: null,
        content: 'Replying to you!',
        type: 'message',
        reply_to: 'msg-1',
        reactions: {},
        image_url: null,
        is_deleted: false,
        created_at: '2025-01-01',
      };
      expect(msg.reply_to).toBe('msg-1');
    });
  });

  describe('Activity', () => {
    it('accepts valid activity', () => {
      const activity: Activity = {
        id: '1',
        wedding_id: '1',
        user_id: '1',
        user_name: 'Janet',
        action: 'added a guest',
        entity_type: 'guest',
        entity_name: 'Aunt Mary',
        created_at: '2025-01-01',
      };
      expect(activity.action).toBe('added a guest');
    });
  });

  describe('DashboardStats', () => {
    it('accepts valid stats object', () => {
      const stats: DashboardStats = {
        daysUntilWedding: 365,
        totalBudget: 50000,
        budgetSpent: 10000,
        budgetRemaining: 40000,
        tasksTotal: 20,
        tasksDone: 5,
        guestsInvited: 100,
        guestsAccepted: 50,
        guestsDeclined: 10,
        guestsPending: 40,
        vendorsBooked: 8,
      };
      expect(stats.daysUntilWedding).toBe(365);
    });
  });
});
