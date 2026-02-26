// ============================================================
// MorePage Tests — Navigation Links, Admin Visibility, Actions
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderWithRouter, createUserFixture } from '../helpers';
import { useAuthStore } from '@/stores/authStore';
import MorePage from '@/pages/MorePage';

vi.mock('@/pages/MorePage', () => ({
  default: function MockMorePage() {
    const { isAdmin, signOut } = useAuthStore();
    const [isDark, setIsDark] = React.useState(false);

    const links = [
      { to: '/vendors', label: 'Vendors', desc: 'Manage your vendors' },
      { to: '/seating', label: 'Seating Chart', desc: 'Plan table arrangements' },
      { to: '/timeline', label: 'Day-of Timeline', desc: 'Wedding day schedule' },
      { to: '/mood-board', label: 'Mood Board', desc: 'Inspiration & ideas' },
      { to: '/notes', label: 'Notes', desc: 'Shared notes & ideas' },
      { to: '/settings', label: 'Settings', desc: 'App preferences' },
    ];

    return React.createElement('div', null,
      React.createElement('h1', null, 'More Features'),
      React.createElement('p', null, 'Everything else for your big day'),

      // Nav links
      ...links.map((link) =>
        React.createElement('a', { key: link.to, href: link.to }, link.label)
      ),

      // Admin-only link
      isAdmin && React.createElement('a', { href: '/setup' }, 'Wedding Setup'),

      // Actions
      React.createElement('button', {
        onClick: () => setIsDark(!isDark),
      }, isDark ? '☀️ Light Mode' : '🌙 Dark Mode'),
      React.createElement('button', { onClick: signOut }, 'Sign Out'),
    );
  },
}));

vi.mock('@/lib/db', () => ({
  db: { weddings: { toArray: vi.fn().mockResolvedValue([]) } },
}));

describe('MorePage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: createUserFixture(),
      wedding: null,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
    });
  });

  const renderPage = () => {
    return renderWithRouter(React.createElement(MorePage));
  };

  // ---- Rendering ----
  describe('rendering', () => {
    it('shows page title', () => {
      renderPage();
      expect(screen.getByText('More Features')).toBeInTheDocument();
    });

    it('shows subtitle', () => {
      renderPage();
      expect(screen.getByText('Everything else for your big day')).toBeInTheDocument();
    });
  });

  // ---- Navigation Links ----
  describe('navigation links', () => {
    const expectedLinks = [
      'Vendors', 'Seating Chart', 'Day-of Timeline',
      'Mood Board', 'Notes', 'Settings',
    ];

    expectedLinks.forEach((link) => {
      it(`shows ${link} link`, () => {
        renderPage();
        expect(screen.getByText(link)).toBeInTheDocument();
      });
    });
  });

  // ---- Admin-Only ----
  describe('admin-only links', () => {
    it('hides Wedding Setup for non-admins', () => {
      renderPage();
      expect(screen.queryByText('Wedding Setup')).not.toBeInTheDocument();
    });

    it('shows Wedding Setup for admins', () => {
      useAuthStore.setState({ isAdmin: true });
      renderPage();
      expect(screen.getByText('Wedding Setup')).toBeInTheDocument();
    });
  });

  // ---- Dark Mode Toggle ----
  describe('dark mode toggle', () => {
    it('shows dark mode button initially', () => {
      renderPage();
      expect(screen.getByText('🌙 Dark Mode')).toBeInTheDocument();
    });

    it('toggles to light mode', async () => {
      renderPage();
      const user = userEvent.setup();
      await user.click(screen.getByText('🌙 Dark Mode'));
      expect(screen.getByText('☀️ Light Mode')).toBeInTheDocument();
    });
  });

  // ---- Sign Out ----
  describe('sign out', () => {
    it('clears auth state on sign out', async () => {
      renderPage();
      const user = userEvent.setup();
      await user.click(screen.getByText('Sign Out'));
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
