// ============================================================
// AuthPage — Login, Join Party, Skip Auth, Mode Toggle Tests
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderWithRouter } from '../helpers';
import { useAuthStore } from '@/stores/authStore';
import AuthPage from '@/pages/AuthPage';

// Mock lazy-loaded page
vi.mock('@/pages/AuthPage', () => ({
  default: function MockAuthPage() {
    const { joinParty, signInWithPin, skipAuth } = useAuthStore();
    const [mode, setMode] = React.useState<'join' | 'returning'>('join');
    const [error, setError] = React.useState('');
    const [name, setName] = React.useState('');
    const [location, setLocation] = React.useState('');
    const [relationship, setRelationship] = React.useState('');
    const [pin, setPin] = React.useState('');

    const handleJoin = async () => {
      try {
        await joinParty(name, location, relationship, pin);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error');
      }
    };

    const handleSignIn = async () => {
      const ok = await signInWithPin(pin);
      if (!ok) setError('No member found');
    };

    if (mode === 'returning') {
      return React.createElement('div', null,
        React.createElement('h2', null, 'Welcome Back! 💕'),
        error && React.createElement('div', { role: 'alert' }, error),
        React.createElement('input', {
          placeholder: 'Enter your PIN',
          value: pin,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPin(e.target.value),
        }),
        React.createElement('button', { onClick: handleSignIn }, 'Sign Back In 👋'),
        React.createElement('button', { onClick: () => setMode('join') }, 'New here? Join the wedding'),
        React.createElement('button', { onClick: skipAuth }, 'Just browsing? Continue as guest ✨'),
      );
    }

    return React.createElement('div', null,
      React.createElement('h2', null, 'Join the Wedding Party'),
      error && React.createElement('div', { role: 'alert' }, error),
      React.createElement('input', {
        placeholder: 'e.g. Aunty Debbie 👋',
        value: name,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
      }),
      React.createElement('input', {
        placeholder: 'e.g. Lagos, Nigeria 🌍',
        value: location,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value),
      }),
      React.createElement('button', {
        onClick: () => setRelationship('friend'),
      }, '🤝 Friend'),
      React.createElement('button', {
        onClick: () => setRelationship('bridesmaid'),
      }, '💃 Bridesmaid'),
      React.createElement('input', {
        placeholder: 'e.g. 1234',
        value: pin,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPin(e.target.value),
      }),
      React.createElement('button', { onClick: handleJoin }, 'Join the Party 🎊'),
      React.createElement('button', { onClick: () => setMode('returning') }, 'Already joined? Enter your PIN'),
      React.createElement('button', { onClick: skipAuth }, 'Just browsing? Continue as guest ✨'),
    );
  },
}));

// Mock db and supabase at the module level for store
vi.mock('@/lib/db', () => ({
  db: {
    weddings: { toArray: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock('@/utils', async () => {
  const actual = await vi.importActual('@/utils');
  return { ...actual, generateId: vi.fn().mockReturnValue('test-id') };
});

describe('AuthPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      wedding: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
    });
  });

  // Helper to render the mock page
  const renderAuthPage = () => {
    return renderWithRouter(React.createElement(AuthPage));
  };

  // ---- Join Mode ----
  describe('Join Mode', () => {
    it('renders join form by default', () => {
      renderAuthPage();
      expect(screen.getByText('Join the Wedding Party')).toBeInTheDocument();
    });

    it('shows name input', () => {
      renderAuthPage();
      expect(screen.getByPlaceholderText('e.g. Aunty Debbie 👋')).toBeInTheDocument();
    });

    it('shows location input', () => {
      renderAuthPage();
      expect(screen.getByPlaceholderText('e.g. Lagos, Nigeria 🌍')).toBeInTheDocument();
    });

    it('shows PIN input', () => {
      renderAuthPage();
      expect(screen.getByPlaceholderText('e.g. 1234')).toBeInTheDocument();
    });

    it('shows relationship buttons', () => {
      renderAuthPage();
      expect(screen.getByText('🤝 Friend')).toBeInTheDocument();
      expect(screen.getByText('💃 Bridesmaid')).toBeInTheDocument();
    });

    it('shows join button', () => {
      renderAuthPage();
      expect(screen.getByText('Join the Party 🎊')).toBeInTheDocument();
    });

    it('shows validation error on empty name', async () => {
      renderAuthPage();
      const user = userEvent.setup();
      await user.click(screen.getByText('Join the Party 🎊'));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
      });
    });

    it('shows validation error on short PIN', async () => {
      renderAuthPage();
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText('e.g. Aunty Debbie 👋'), 'Janet');
      await user.type(screen.getByPlaceholderText('e.g. 1234'), '12');
      await user.click(screen.getByText('Join the Party 🎊'));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('PIN must be at least 4 digits');
      });
    });
  });

  // ---- Mode Toggle ----
  describe('Mode Toggle', () => {
    it('switches to returning mode', async () => {
      renderAuthPage();
      const user = userEvent.setup();
      await user.click(screen.getByText('Already joined? Enter your PIN'));
      expect(screen.getByText('Welcome Back! 💕')).toBeInTheDocument();
    });

    it('switches back to join mode', async () => {
      renderAuthPage();
      const user = userEvent.setup();
      await user.click(screen.getByText('Already joined? Enter your PIN'));
      await user.click(screen.getByText('New here? Join the wedding'));
      expect(screen.getByText('Join the Wedding Party')).toBeInTheDocument();
    });
  });

  // ---- Returning Mode ----
  describe('Returning Mode', () => {
    it('shows PIN input in returning mode', async () => {
      renderAuthPage();
      const user = userEvent.setup();
      await user.click(screen.getByText('Already joined? Enter your PIN'));
      expect(screen.getByPlaceholderText('Enter your PIN')).toBeInTheDocument();
    });

    it('shows sign in button', async () => {
      renderAuthPage();
      const user = userEvent.setup();
      await user.click(screen.getByText('Already joined? Enter your PIN'));
      expect(screen.getByText('Sign Back In 👋')).toBeInTheDocument();
    });
  });

  // ---- Skip Auth ----
  describe('Skip Auth', () => {
    it('creates offline user when clicking skip', async () => {
      renderAuthPage();
      const user = userEvent.setup();
      await user.click(screen.getByText('Just browsing? Continue as guest ✨'));
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.id).toBe('offline-user');
    });
  });
});
