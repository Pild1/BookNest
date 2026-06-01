import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthScreen } from './AuthScreen';

beforeEach(() => {
  window.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            token: 'token-123',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            user: { id: 'user-1', displayName: 'Reader', role: 'USER' },
          },
        }),
    }),
  );
});

describe('AuthScreen', () => {
  it('logs in through the backend auth endpoint', async () => {
    const onAuthenticated = vi.fn();
    const user = userEvent.setup();
    render(<AuthScreen onAuthenticated={onAuthenticated} />);

    await user.type(screen.getByLabelText('Email'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'Secret123');
    await user.click(screen.getAllByRole('button', { name: 'Login' })[1]);

    expect(window.fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(onAuthenticated).toHaveBeenCalledWith(expect.objectContaining({ token: 'token-123' }));
  });

  it('registers through the backend auth endpoint', async () => {
    const onAuthenticated = vi.fn();
    const user = userEvent.setup();
    render(<AuthScreen onAuthenticated={onAuthenticated} />);

    await user.click(screen.getByRole('button', { name: 'Register' }));
    await user.type(screen.getByLabelText('Display name'), 'Reader');
    await user.type(screen.getByLabelText('Email'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(window.fetch).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(onAuthenticated).toHaveBeenCalled();
  });
});
