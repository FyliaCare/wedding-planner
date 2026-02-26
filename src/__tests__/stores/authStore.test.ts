// ============================================================
// Auth Store — PIN Auth, Session, Skip Auth Tests
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import type { User, Wedding } from '@/types';

// We need to mock db for the initialize method
vi.mock('@/lib/db', () => ({
  db: {
    weddings: {
      toArray: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('@/utils', () => ({
  generateId: vi.fn().mockReturnValue('test-user-id'),
}));

const createUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: '',
  name: 'Janet',
  avatar_url: null,
  role: 'couple',
  location: 'London',
  relationship: 'bride',
  created_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createWedding = (overrides: Partial<Wedding> = {}): Wedding => ({
  id: 'wedding-1',
  user_id: 'user-1',
  partner1_name: 'Janet',
  partner2_name: 'Jojo',
  wedding_date: '2025-12-20',
  venue: 'Rose Garden',
  location: 'London',
  theme: 'romantic',
  total_budget: 50000,
  cover_image_url: null,
  created_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      wedding: null,
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
    });
  });

  // ---- Initial State ----
  describe('initial state', () => {
    it('starts with null user', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('starts with null wedding', () => {
      expect(useAuthStore.getState().wedding).toBeNull();
    });

    it('starts unauthenticated', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('starts with isLoading true', () => {
      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('starts as non-admin', () => {
      expect(useAuthStore.getState().isAdmin).toBe(false);
    });
  });

  // ---- setUser ----
  describe('setUser', () => {
    it('sets user and marks authenticated', () => {
      useAuthStore.getState().setUser(createUser());
      expect(useAuthStore.getState().user?.name).toBe('Janet');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('clears user and marks unauthenticated', () => {
      useAuthStore.getState().setUser(createUser());
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  // ---- setWedding ----
  describe('setWedding', () => {
    it('sets wedding', () => {
      useAuthStore.getState().setWedding(createWedding());
      expect(useAuthStore.getState().wedding?.partner1_name).toBe('Janet');
    });

    it('clears wedding', () => {
      useAuthStore.getState().setWedding(createWedding());
      useAuthStore.getState().setWedding(null);
      expect(useAuthStore.getState().wedding).toBeNull();
    });
  });

  // ---- skipAuth ----
  describe('skipAuth', () => {
    it('creates offline user', () => {
      useAuthStore.getState().skipAuth();
      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('offline-user');
      expect(state.user?.name).toBe('Guest');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isAdmin).toBe(false);
    });

    it('sets offline flag in localStorage', () => {
      useAuthStore.getState().skipAuth();
      expect(localStorage.getItem('wedplanner_offline')).toBe('true');
    });
  });

  // ---- signOut ----
  describe('signOut', () => {
    it('clears all auth state', () => {
      useAuthStore.setState({
        user: createUser(),
        wedding: createWedding(),
        isAuthenticated: true,
        isAdmin: true,
      });
      useAuthStore.getState().signOut();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.wedding).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isAdmin).toBe(false);
    });

    it('removes localStorage keys', () => {
      localStorage.setItem('wedplanner_current_user', 'user-1');
      localStorage.setItem('wedplanner_offline', 'true');
      useAuthStore.getState().signOut();
      expect(localStorage.getItem('wedplanner_current_user')).toBeNull();
      expect(localStorage.getItem('wedplanner_offline')).toBeNull();
    });
  });

  // ---- joinParty validation ----
  describe('joinParty', () => {
    it('throws on empty name', async () => {
      await expect(
        useAuthStore.getState().joinParty('', 'London', 'friend', '1234')
      ).rejects.toThrow('Name is required');
    });

    it('throws on short PIN', async () => {
      await expect(
        useAuthStore.getState().joinParty('Test', 'London', 'friend', '12')
      ).rejects.toThrow('PIN must be at least 4 digits');
    });

    it('throws on empty PIN', async () => {
      await expect(
        useAuthStore.getState().joinParty('Test', 'London', 'friend', '')
      ).rejects.toThrow('PIN must be at least 4 digits');
    });
  });

  // ---- signInWithPin ----
  describe('signInWithPin', () => {
    it('returns false for empty PIN', async () => {
      const result = await useAuthStore.getState().signInWithPin('');
      expect(result).toBe(false);
    });

    it('returns false for whitespace-only PIN', async () => {
      const result = await useAuthStore.getState().signInWithPin('   ');
      expect(result).toBe(false);
    });
  });

  // ---- initialize ----
  describe('initialize', () => {
    it('sets isLoading to false when done', async () => {
      await useAuthStore.getState().initialize();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('restores offline session from localStorage', async () => {
      localStorage.setItem('wedplanner_offline', 'true');
      await useAuthStore.getState().initialize();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.id).toBe('offline-user');
    });

    it('restores dark mode from localStorage', async () => {
      localStorage.setItem('wedplanner_dark_mode', 'true');
      await useAuthStore.getState().initialize();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      // cleanup
      document.documentElement.classList.remove('dark');
    });
  });
});
