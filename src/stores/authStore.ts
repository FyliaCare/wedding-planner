import { create } from 'zustand';
import type { User, Wedding } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  wedding: Wedding | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setWedding: (wedding: Wedding | null) => void;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
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

  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (data.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          name,
          avatar_url: null,
          role: 'couple',
          created_at: new Date().toISOString(),
        },
        isAuthenticated: true,
      });
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.['name'] as string || '',
          avatar_url: data.user.user_metadata?.['avatar_url'] as string || null,
          role: 'couple',
          created_at: data.user.created_at,
        },
        isAuthenticated: true,
      });
      // Load wedding
      const { data: weddings } = await supabase
        .from('weddings')
        .select('*')
        .eq('user_id', data.user.id)
        .limit(1);
      if (weddings && weddings.length > 0) {
        set({ wedding: weddings[0] as Wedding });
      }
    }
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.['name'] as string || '',
          avatar_url: session.user.user_metadata?.['avatar_url'] as string || null,
          role: 'couple',
          created_at: session.user.created_at,
        };
        set({ user, isAuthenticated: true });

        const { data: weddings } = await supabase
          .from('weddings')
          .select('*')
          .eq('user_id', session.user.id)
          .limit(1);
        if (weddings && weddings.length > 0) {
          set({ wedding: weddings[0] as Wedding });
        }
      }
    } catch {
      // Offline or no session — continue with local-only mode
    }

    // Restore offline/guest session
    if (!get().isAuthenticated && localStorage.getItem('wedplanner_offline')) {
      get().skipAuth();
    }

    set({ isLoading: false });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        get().setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.['name'] as string || '',
          avatar_url: session.user.user_metadata?.['avatar_url'] as string || null,
          role: 'couple',
          created_at: session.user.created_at,
        });
      } else {
        get().setUser(null);
        get().setWedding(null);
      }
    });
  },
}));
