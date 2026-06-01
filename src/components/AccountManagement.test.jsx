import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountManagement } from './AccountManagement';

beforeEach(() => {
  window.fetch = vi.fn(async (url) => {
    if (String(url).includes('/api/admin/users')) {
      return {
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'user-1',
              email: 'reader@example.com',
              displayName: 'Reader',
              role: 'USER',
              bookCount: 2,
              activeSessions: [
                {
                  id: 'session-1',
                  role: 'USER',
                  lastActivityAt: '2026-06-01T12:00:00.000Z',
                  expiresAt: '2026-06-01T13:00:00.000Z',
                },
              ],
            },
          ],
        }),
      };
    }

    return { ok: false, json: async () => ({ error: 'Not found' }) };
  });
});

describe('AccountManagement', () => {
  it('renders users for admins', async () => {
    render(<AccountManagement token="admin-token" currentUserId="admin-1" />);

    await waitFor(() => expect(screen.getByText('Reader')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Account management' })).toBeInTheDocument();
    expect(screen.getByLabelText('Role for Reader')).toHaveValue('USER');
  });
});
