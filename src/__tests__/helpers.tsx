// ============================================================
// Test Helpers — Render with Providers, Factories
// ============================================================
import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Render a component wrapped in MemoryRouter for routing context
 */
export function renderWithRouter(
  ui: ReactElement,
  options?: RenderOptions & { route?: string }
) {
  const { route = '/', ...renderOptions } = options ?? {};
  return render(
    React.createElement(MemoryRouter, { initialEntries: [route] }, ui),
    renderOptions
  );
}

/**
 * Wait for async state updates to settle
 */
export async function waitForStateUpdate(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

/**
 * Create a base wedding fixture
 */
export function createWeddingFixture() {
  return {
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
  };
}

/**
 * Create a base user fixture
 */
export function createUserFixture() {
  return {
    id: 'user-1',
    email: '',
    name: 'Janet',
    avatar_url: null,
    role: 'couple' as const,
    location: 'London',
    relationship: 'bride',
    created_at: '2025-01-01T00:00:00Z',
  };
}
