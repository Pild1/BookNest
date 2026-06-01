import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { renderWithRouter } from './test/renderWithRouter';
import { initialBooks } from './data/books';
import { mapBookToApi } from './services/bookMappers';

function toApiBook(book) {
  return {
    ...mapBookToApi(book),
    id: book.id,
    createdAt: book.createdAt,
    isDeleted: book.isDeleted,
    isWishlist: book.isWishlist,
    loan: book.loan,
  };
}

let apiBooks = [];

function createBooksFetchMock() {
  return vi.fn(async (url, options = {}) => {
    const path = String(url);
    const method = options.method || 'GET';
    const auth = JSON.parse(localStorage.getItem('booknest-auth'));

    if (path.includes('/api/auth/me')) {
      return {
        ok: true,
        json: async () => ({
          data: {
            user: {
              ...auth.user,
              expiresAt: auth.expiresAt,
            },
          },
        }),
      };
    }

    if (path.includes('/api/books')) {
      const idMatch = path.match(/\/api\/books\/([^/?]+)/);

      if (method === 'GET' && !idMatch) {
        const active = apiBooks.filter((book) => !book.isDeleted);
        return {
          ok: true,
          json: async () => ({
            data: active,
            pagination: { page: 1, pageSize: 100, totalItems: active.length, totalPages: 1 },
          }),
        };
      }

      if (method === 'POST') {
        const payload = JSON.parse(options.body);
        const created = {
          id: `book-${apiBooks.length + 1}`,
          createdAt: new Date().toISOString(),
          isDeleted: false,
          isWishlist: false,
          loan: payload.loan ?? null,
          ...payload,
        };
        apiBooks = [created, ...apiBooks];
        return { ok: true, json: async () => ({ data: created }) };
      }

      if (method === 'PUT' && idMatch) {
        const payload = JSON.parse(options.body);
        const id = decodeURIComponent(idMatch[1]);
        apiBooks = apiBooks.map((book) => (book.id === id ? { ...book, ...payload, id } : book));
        const updated = apiBooks.find((book) => book.id === id);
        return { ok: true, json: async () => ({ data: updated }) };
      }

      if (method === 'DELETE' && idMatch) {
        const id = decodeURIComponent(idMatch[1]);
        apiBooks = apiBooks.map((book) => (book.id === id ? { ...book, isDeleted: true } : book));
        return { ok: true, json: async () => ({ data: { id, deleted: true } }) };
      }
    }

    return { ok: true, json: async () => ({ data: {} }) };
  });
}

beforeEach(() => {
  apiBooks = initialBooks.map(toApiBook);
  window.confirm = vi.fn(() => true);
  window.fetch = createBooksFetchMock();
  localStorage.setItem(
    'booknest-auth',
    JSON.stringify({
      token: 'test-token',
      user: { id: 'user-test', displayName: 'Test Reader', role: 'USER' },
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }),
  );
});

async function renderLibrary() {
  renderWithRouter(<App />, { route: '/' });
  await waitFor(() => expect(screen.queryByText(/Verifying your session/i)).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText(/Loading your library/i)).not.toBeInTheDocument());
  await screen.findByText('The Hobbit');
}

describe('BookNest app', () => {
  it('renders the presentation and paginated library', async () => {
    await renderLibrary();

    expect(screen.getByRole('heading', { name: 'BookNest' })).toBeInTheDocument();
    expect(screen.getByText(/Signed in as/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My Library' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('filters the master table and updates the detail view', async () => {
    const user = userEvent.setup();
    await renderLibrary();

    await user.type(screen.getByPlaceholderText('Search by title or author'), 'hobbit');
    await user.click(screen.getByText('The Hobbit'));

    expect(screen.getByLabelText('The Hobbit details')).toBeInTheDocument();
    expect(screen.queryByText('Pride and Prejudice')).not.toBeInTheDocument();
  });

  it('validates and adds a book through the API', async () => {
    const user = userEvent.setup();
    await renderLibrary();

    await user.click(screen.getByRole('button', { name: 'Add book' }));
    await user.click(screen.getByRole('button', { name: 'Save book' }));
    expect(screen.getByText('Title is required.')).toBeInTheDocument();

    const dialog = screen.getByRole('dialog', { name: 'Book form' });
    await user.type(within(dialog).getByLabelText('Title'), 'A Wizard of Earthsea');
    await user.type(within(dialog).getByLabelText('Author'), 'Ursula K. Le Guin');
    await user.selectOptions(within(dialog).getByLabelText('Genre'), 'Fantasy');
    await user.type(within(dialog).getByLabelText('Cover URL'), 'https://example.com/earthsea.jpg');
    await user.clear(within(dialog).getByLabelText('Total pages'));
    await user.type(within(dialog).getByLabelText('Total pages'), '205');
    await user.click(screen.getByRole('button', { name: 'Save book' }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Book form' })).not.toBeInTheDocument());
    expect(screen.getAllByText('A Wizard of Earthsea').length).toBeGreaterThan(0);
    expect(window.fetch).toHaveBeenCalledWith(
      '/api/books',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('edits and soft-deletes the selected book', async () => {
    const user = userEvent.setup();
    await renderLibrary();

    await user.click(screen.getAllByText('The Left Hand of Darkness')[0]);
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = screen.getByRole('dialog', { name: 'Book form' });
    await user.clear(within(dialog).getByLabelText('Title'));
    await user.type(within(dialog).getByLabelText('Title'), 'Left Hand Updated');
    await user.click(screen.getByRole('button', { name: 'Save book' }));

    await waitFor(() => expect(screen.getAllByText('Left Hand Updated').length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('Left Hand Updated')).not.toBeInTheDocument());
  });
});
