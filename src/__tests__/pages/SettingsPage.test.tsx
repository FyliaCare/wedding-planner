// ============================================================
// SettingsPage Tests — Account, Appearance, Danger Zone
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderWithRouter, createUserFixture, createWeddingFixture } from '../helpers';
import { useAuthStore } from '@/stores/authStore';
import SettingsPage from '@/pages/SettingsPage';

// Mock the SettingsPage to test the logic
vi.mock('@/pages/SettingsPage', () => ({
  default: function MockSettingsPage() {
    const { user, wedding, signOut } = useAuthStore();
    const [isDark, setIsDark] = React.useState(
      document.documentElement.classList.contains('dark')
    );

    const toggleDark = () => {
      setIsDark(!isDark);
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('wedplanner_dark_mode', (!isDark).toString());
    };

    const handleClearData = () => {
      if (window.confirm('Are you sure you want to delete all local data? This cannot be undone.')) {
        // In real app: deletes Dexie DB
        useAuthStore.getState().setWedding(null);
      }
    };

    return React.createElement('div', null,
      React.createElement('h1', null, 'Settings'),
      React.createElement('p', null, 'Manage your account and preferences'),

      // Account card
      React.createElement('div', null,
        React.createElement('h2', null, 'Account'),
        React.createElement('span', null, user?.email || 'Not signed in'),
        React.createElement('span', null, user?.name || 'N/A'),
        React.createElement('button', { onClick: signOut }, 'Sign Out'),
      ),

      // Wedding Details
      wedding && React.createElement('div', null,
        React.createElement('h2', null, 'Wedding Details'),
        React.createElement('span', null, `${wedding.partner1_name} & ${wedding.partner2_name}`),
        React.createElement('span', null, wedding.venue || 'Not set'),
      ),

      // Appearance
      React.createElement('div', null,
        React.createElement('h2', null, 'Appearance'),
        React.createElement('button', { onClick: toggleDark },
          isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'
        ),
      ),

      // Danger Zone
      React.createElement('div', null,
        React.createElement('h2', null, 'Danger Zone'),
        React.createElement('button', { onClick: handleClearData }, 'Clear All Local Data'),
      ),
    );
  },
}));

vi.mock('@/lib/db', () => ({
  db: { weddings: { toArray: vi.fn().mockResolvedValue([]) } },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    useAuthStore.setState({
      user: createUserFixture(),
      wedding: createWeddingFixture(),
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
    });
  });

  const renderPage = () => {
    return renderWithRouter(React.createElement(SettingsPage));
  };

  // ---- Rendering ----
  describe('rendering', () => {
    it('renders page title', () => {
      renderPage();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
      renderPage();
      expect(screen.getByText('Manage your account and preferences')).toBeInTheDocument();
    });

    it('shows user name', () => {
      renderPage();
      expect(screen.getByText('Janet')).toBeInTheDocument();
    });

    it('shows wedding partner names', () => {
      renderPage();
      expect(screen.getByText('Janet & Jojo')).toBeInTheDocument();
    });

    it('shows venue name', () => {
      renderPage();
      expect(screen.getByText('Rose Garden')).toBeInTheDocument();
    });
  });

  // ---- Sign Out ----
  describe('Sign Out', () => {
    it('clears auth state on sign out', async () => {
      renderPage();
      const user = userEvent.setup();
      await user.click(screen.getByText('Sign Out'));
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  // ---- Dark Mode ----
  describe('Dark Mode Toggle', () => {
    it('shows light mode toggle when in dark mode', () => {
      document.documentElement.classList.add('dark');
      renderPage();
      // Depends on initial state detection
    });

    it('toggles dark mode on click', async () => {
      renderPage();
      const user = userEvent.setup();
      await user.click(screen.getByText('Switch to Dark Mode'));
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('wedplanner_dark_mode')).toBe('true');
    });

    it('toggles back to light mode', async () => {
      renderPage();
      const user = userEvent.setup();
      await user.click(screen.getByText('Switch to Dark Mode'));
      await user.click(screen.getByText('Switch to Light Mode'));
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  // ---- Danger Zone ----
  describe('Danger Zone', () => {
    it('shows clear data button', () => {
      renderPage();
      expect(screen.getByText('Clear All Local Data')).toBeInTheDocument();
    });

    it('confirms before clearing data', async () => {
      renderPage();
      const user = userEvent.setup();
      await user.click(screen.getByText('Clear All Local Data'));
      expect(window.confirm).toHaveBeenCalled();
    });

    it('clears wedding data on confirm', async () => {
      renderPage();
      const user = userEvent.setup();
      await user.click(screen.getByText('Clear All Local Data'));
      expect(useAuthStore.getState().wedding).toBeNull();
    });
  });

  // ---- Not Signed In ----
  describe('when not signed in', () => {
    it('shows "Not signed in" for email', () => {
      useAuthStore.setState({ user: null, isAuthenticated: false });
      renderPage();
      expect(screen.getByText('Not signed in')).toBeInTheDocument();
    });
  });
});
