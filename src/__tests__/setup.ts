// ============================================================
// Global Test Setup — Mocks for Supabase, Dexie, localStorage
// ============================================================
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { vi, beforeEach, afterEach } from 'vitest';

// ---- Mock crypto.randomUUID ----
if (!globalThis.crypto?.randomUUID) {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => `test-uuid-${++counter}`,
    },
    writable: true,
    configurable: true,
  });
}

// ---- Mock navigator.onLine ----
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
  configurable: true,
});

// ---- Mock import.meta.env ----
if (!(import.meta as unknown as Record<string, unknown>).env) {
  (import.meta as unknown as Record<string, unknown>).env = {};
}

// ---- Mock localStorage ----
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// ---- Mock matchMedia (for dark mode) ----
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ---- Mock window.confirm ----
window.confirm = vi.fn(() => true);

// ---- Mock IntersectionObserver ----
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// ---- Mock ResizeObserver ----
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// ---- Supabase Mock Factory ----
const createMockQueryBuilder = () => {
  const builder: Record<string, unknown> = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'is', 'in', 'contains', 'containedBy',
    'order', 'limit', 'range', 'single', 'maybeSingle',
    'filter', 'match', 'not', 'or', 'and',
    'count', 'head', 'csv', 'geojson',
  ];
  methods.forEach((m) => {
    builder[m] = vi.fn().mockReturnValue(builder);
  });
  // Terminal calls should resolve
  (builder['maybeSingle'] as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null });
  (builder['single'] as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null });
  return builder;
};

export const mockSupabaseFrom = vi.fn().mockReturnValue(createMockQueryBuilder());

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis(),
  track: vi.fn().mockResolvedValue('ok'),
  presenceState: vi.fn().mockReturnValue({}),
};

export const mockSupabase = {
  from: mockSupabaseFrom,
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn().mockResolvedValue('ok'),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
};

// ---- Apply Supabase Mock ----
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
  isSupabaseConfigured: true,
  default: mockSupabase,
}));

// ---- Mock react-router-dom navigate ----
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---- Clean up between tests ----
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

export { mockNavigate, localStorageMock };
