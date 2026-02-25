// ============================================================
// Wedding Planner PWA — Core Type Definitions
// ============================================================

// ---------- Auth & Users ----------
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: 'couple' | 'planner' | 'guest';
  created_at: string;
}

// ---------- Wedding ----------
export interface Wedding {
  id: string;
  user_id: string;
  partner1_name: string;
  partner2_name: string;
  wedding_date: string;
  venue: string;
  location: string;
  theme: string;
  total_budget: number;
  cover_image_url: string | null;
  created_at: string;
}

export interface WeddingMember {
  id: string;
  wedding_id: string;
  user_id: string;
  role: 'couple' | 'planner' | 'guest';
}

// ---------- Tasks / Checklist ----------
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'music'
  | 'flowers'
  | 'attire'
  | 'invitations'
  | 'transportation'
  | 'accommodation'
  | 'legal'
  | 'other';

export interface Task {
  id: string;
  wedding_id: string;
  title: string;
  description: string;
  category: TaskCategory;
  due_date: string | null;
  assigned_to: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
}

// ---------- Budget ----------
export type PaymentStatus = 'pending' | 'deposit-paid' | 'fully-paid';

export interface BudgetCategory {
  id: string;
  wedding_id: string;
  name: string;
  allocated_amount: number;
  icon: string;
}

export interface BudgetItem {
  id: string;
  category_id: string;
  wedding_id: string;
  name: string;
  estimated_cost: number;
  actual_cost: number;
  payment_status: PaymentStatus;
  vendor_id: string | null;
  notes: string;
}

// ---------- Guests ----------
export type RSVPStatus = 'invited' | 'sent' | 'accepted' | 'declined' | 'pending';
export type MealPreference = 'standard' | 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'gluten-free' | 'other';
export type GuestGroup = 'bride-family' | 'groom-family' | 'bride-friends' | 'groom-friends' | 'work' | 'other';

export interface Guest {
  id: string;
  wedding_id: string;
  name: string;
  email: string;
  phone: string;
  group: GuestGroup;
  meal_preference: MealPreference;
  dietary_restrictions: string;
  plus_one: boolean;
  plus_one_name: string;
  rsvp_status: RSVPStatus;
  table_id: string | null;
  seat_number: number | null;
  notes: string;
  created_at: string;
}

// ---------- Vendors ----------
export type VendorCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'videography'
  | 'florist'
  | 'music-dj'
  | 'music-band'
  | 'cake'
  | 'hair-makeup'
  | 'transportation'
  | 'stationery'
  | 'rentals'
  | 'planner'
  | 'officiant'
  | 'other';

export interface Vendor {
  id: string;
  wedding_id: string;
  name: string;
  category: VendorCategory;
  email: string;
  phone: string;
  website: string;
  contract_url: string | null;
  total_cost: number;
  deposit_paid: number;
  rating: number;
  notes: string;
  created_at: string;
}

// ---------- Seating ----------
export type TableShape = 'round' | 'rectangular' | 'square';

export interface SeatingTable {
  id: string;
  wedding_id: string;
  name: string;
  shape: TableShape;
  capacity: number;
  position_x: number;
  position_y: number;
}

// ---------- Timeline ----------
export interface TimelineEvent {
  id: string;
  wedding_id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  responsible_person: string;
  notes: string;
  sort_order: number;
}

// ---------- Mood Board ----------
export type MoodBoardCategory = 'decor' | 'dress' | 'flowers' | 'cake' | 'venue' | 'hair-makeup' | 'invitations' | 'other';

export interface MoodBoardItem {
  id: string;
  wedding_id: string;
  image_url: string;
  category: MoodBoardCategory;
  caption: string;
  created_at: string;
}

// ---------- Notes ----------
export interface Note {
  id: string;
  wedding_id: string;
  author_id: string;
  title: string;
  content: string;
  vendor_id: string | null;
  created_at: string;
}

// ---------- Dashboard Stats ----------
export interface DashboardStats {
  daysUntilWedding: number;
  totalBudget: number;
  budgetSpent: number;
  budgetRemaining: number;
  tasksTotal: number;
  tasksDone: number;
  guestsInvited: number;
  guestsAccepted: number;
  guestsDeclined: number;
  guestsPending: number;
  vendorsBooked: number;
}
