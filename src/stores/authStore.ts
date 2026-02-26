import { create } from 'zustand';
import type { User, Wedding } from '@/types';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/utils';

const CURRENT_KEY = 'wedplanner_current_user';

interface MemberRow {
  id: string;
  name: string;
  location: string;
  relationship: string;
  pin: string;
  avatar_url: string | null;
  created_at: string;
}

function memberToUser(m: MemberRow): User {
  return {
    id: m.id,
    email: '',
    name: m.name,
    avatar_url: m.avatar_url,
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
  joinParty: (name: string, location: string, relationship: string, pin: string) => Promise<void>;
  signInWithPin: (pin: string) => Promise<boolean>;
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

  joinParty: async (name, location, relationship, pin) => {
    // Check PIN uniqueness in Supabase
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('pin', pin)
      .maybeSingle();

    if (existing) throw new Error('That PIN is already taken — pick a different one!');

    const member: MemberRow = {
      id: generateId(),
      name,
      location,
      relationship,
      pin,
      avatar_url: null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('members').insert(member);
    if (error) throw new Error(error.message);

    const user = memberToUser(member);
    localStorage.setItem(CURRENT_KEY, member.id);
    set({ user, isAuthenticated: true });
  },

  signInWithPin: async (pin) => {
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('pin', pin)
      .maybeSingle();

    if (!member) return false;

    const user = memberToUser(member as MemberRow);
    localStorage.setItem(CURRENT_KEY, member.id as string);
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
    // Restore saved session from Supabase
    const currentId = localStorage.getItem(CURRENT_KEY);
    if (currentId) {
      try {
        const { data: member } = await supabase
          .from('members')
          .select('*')
          .eq('id', currentId)
          .maybeSingle();

        if (member) {
          set({ user: memberToUser(member as MemberRow), isAuthenticated: true });
        }
      } catch {
        // Offline — skip
      }
    }

    // Restore offline/guest session
    if (!get().isAuthenticated && localStorage.getItem('wedplanner_offline')) {
      get().skipAuth();
    }

    set({ isLoading: false });
  },
}));
