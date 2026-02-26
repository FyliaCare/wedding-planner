import { create } from 'zustand';
import type { User, Wedding } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/lib/db';
import { generateId } from '@/utils';

const CURRENT_KEY = 'wedplanner_current_user';
const DARK_MODE_KEY = 'wedplanner_dark_mode';

interface MemberRow {
  id: string;
  name: string;
  location: string;
  relationship: string;
  pin: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

function memberToUser(m: MemberRow): User {
  return {
    id: m.id,
    email: '',
    name: m.name,
    avatar_url: m.avatar_url,
    role: m.is_admin ? 'couple' : 'guest',
    location: m.location,
    relationship: m.relationship,
    created_at: m.created_at,
  };
}

// ---- Store ----
interface AuthState {
  user: User | null;
  wedding: Wedding | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;

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
  isAdmin: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setWedding: (wedding) => set({ wedding }),

  joinParty: async (name, location, relationship, pin) => {
    if (!name.trim()) throw new Error('Name is required');
    if (!pin.trim() || pin.length < 4) throw new Error('PIN must be at least 4 digits');

    if (!isSupabaseConfigured) {
      throw new Error('Backend is not configured. Ask the couple for the correct link!');
    }

    // Check PIN uniqueness in Supabase
    const { data: existing, error: pinCheckError } = await supabase
      .from('members')
      .select('id')
      .eq('pin', pin)
      .maybeSingle();

    if (pinCheckError) throw new Error(pinCheckError.message);
    if (existing) throw new Error('That PIN is already taken — pick a different one!');

    const member: MemberRow = {
      id: generateId(),
      name: name.trim(),
      location: location.trim(),
      relationship,
      pin,
      avatar_url: null,
      is_admin: false,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('members').insert(member);
    if (error) throw new Error(error.message);

    const user = memberToUser(member);
    localStorage.setItem(CURRENT_KEY, member.id);
    set({ user, isAuthenticated: true, isAdmin: false });
  },

  signInWithPin: async (pin) => {
    if (!pin.trim()) return false;

    if (!isSupabaseConfigured) {
      throw new Error('Backend is not configured. Ask the couple for the correct link!');
    }

    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('pin', pin)
      .maybeSingle();

    if (error) {
      console.error('Sign-in error:', error.message);
      return false;
    }
    if (!member) return false;

    const row = member as MemberRow;
    const user = memberToUser(row);
    localStorage.setItem(CURRENT_KEY, row.id);
    set({ user, isAuthenticated: true, isAdmin: !!row.is_admin });
    return true;
  },

  signOut: () => {
    localStorage.removeItem(CURRENT_KEY);
    localStorage.removeItem('wedplanner_offline');
    set({ user: null, wedding: null, isAuthenticated: false, isAdmin: false });
  },

  skipAuth: () => {
    const offlineUser: User = {
      id: 'offline-user',
      email: '',
      name: 'Guest',
      avatar_url: null,
      role: 'guest',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('wedplanner_offline', 'true');
    set({ user: offlineUser, isAuthenticated: true, isAdmin: false });
  },

  initialize: async () => {
    // Restore dark mode preference
    const darkPref = localStorage.getItem(DARK_MODE_KEY);
    if (darkPref === 'true') {
      document.documentElement.classList.add('dark');
    } else if (darkPref === 'false') {
      document.documentElement.classList.remove('dark');
    }

    // Restore saved session from Supabase
    const currentId = localStorage.getItem(CURRENT_KEY);
    if (currentId) {
      try {
        if (isSupabaseConfigured) {
          const { data: member } = await supabase
            .from('members')
            .select('*')
            .eq('id', currentId)
            .maybeSingle();

          if (member) {
            const row = member as MemberRow;
            set({ user: memberToUser(row), isAuthenticated: true, isAdmin: !!row.is_admin });
          }
        }
      } catch (e) {
        console.warn('Could not restore session from Supabase (offline?):', e);
      }
    }

    // Restore offline/guest session
    if (!get().isAuthenticated && localStorage.getItem('wedplanner_offline')) {
      get().skipAuth();
    }

    // Restore wedding data — try Supabase first, fall back to IndexedDB
    if (get().isAuthenticated && !get().wedding) {
      try {
        if (isSupabaseConfigured) {
          const { data: weddings } = await supabase
            .from('weddings')
            .select('*')
            .limit(1)
            .maybeSingle();
          if (weddings) {
            set({ wedding: weddings as Wedding });
            // Cache in IndexedDB for offline use
            await db.weddings.put(weddings as Wedding).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Could not restore wedding from Supabase:', e);
      }

      // Fallback to IndexedDB if Supabase didn't return a wedding
      if (!get().wedding) {
        try {
          const localWeddings = await db.weddings.toArray();
          if (localWeddings.length > 0) {
            set({ wedding: localWeddings[0] });
          }
        } catch (e) {
          console.warn('Could not restore wedding from IndexedDB:', e);
        }
      }
    }

    set({ isLoading: false });
  },
}));
