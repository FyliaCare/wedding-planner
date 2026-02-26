import { create } from 'zustand';
import type { User, Wedding } from '@/types';
import { generateId } from '@/utils';

// ---- Helpers: store all members in localStorage ----
const MEMBERS_KEY = 'wedplanner_members';
const CURRENT_KEY = 'wedplanner_current_user';

interface StoredMember {
  id: string;
  name: string;
  location: string;
  relationship: string;
  pin: string;
  created_at: string;
}

function getMembers(): StoredMember[] {
  try { return JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]'); }
  catch { return []; }
}

function saveMember(m: StoredMember) {
  const members = getMembers().filter((x) => x.id !== m.id);
  members.push(m);
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
}

function findByPin(pin: string): StoredMember | undefined {
  return getMembers().find((m) => m.pin === pin);
}

function memberToUser(m: StoredMember): User {
  return {
    id: m.id,
    email: '',
    name: m.name,
    avatar_url: null,
    role: 'guest',
    location: m.location,
    relationship: m.relationship,
    pin: m.pin,
    created_at: m.created_at,
  };
}

// ---- Store ----
interface AuthState {
  user: User | null;
  wedding: Wedding | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setWedding: (wedding: Wedding | null) => void;
  joinParty: (name: string, location: string, relationship: string, pin: string) => void;
  signInWithPin: (pin: string) => boolean;
  signOut: () => void;
  skipAuth: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  wedding: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setWedding: (wedding) => set({ wedding }),

  joinParty: (name, location, relationship, pin) => {
    // Check PIN uniqueness
    const existing = findByPin(pin);
    if (existing) throw new Error('That PIN is already taken — pick a different one!');

    const member: StoredMember = {
      id: generateId(),
      name,
      location,
      relationship,
      pin,
      created_at: new Date().toISOString(),
    };
    saveMember(member);
    const user = memberToUser(member);
    localStorage.setItem(CURRENT_KEY, member.id);
    set({ user, isAuthenticated: true });
  },

  signInWithPin: (pin) => {
    const member = findByPin(pin);
    if (!member) return false;
    const user = memberToUser(member);
    localStorage.setItem(CURRENT_KEY, member.id);
    set({ user, isAuthenticated: true });
    return true;
  },

  signOut: () => {
    localStorage.removeItem(CURRENT_KEY);
    localStorage.removeItem('wedplanner_offline');
    set({ user: null, wedding: null, isAuthenticated: false });
  },

  skipAuth: () => {
    const offlineUser: User = {
      id: 'offline-user',
      email: '',
      name: 'Guest',
      avatar_url: null,
      role: 'couple',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('wedplanner_offline', 'true');
    set({ user: offlineUser, isAuthenticated: true });
  },

  initialize: async () => {
    // Restore saved session
    const currentId = localStorage.getItem(CURRENT_KEY);
    if (currentId) {
      const members = getMembers();
      const member = members.find((m) => m.id === currentId);
      if (member) {
        set({ user: memberToUser(member), isAuthenticated: true });
      }
    }

    // Restore offline/guest session
    if (!get().isAuthenticated && localStorage.getItem('wedplanner_offline')) {
      get().skipAuth();
    }

    set({ isLoading: false });
  },
}));
