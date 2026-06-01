import { useEffect, useMemo, useReducer, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bookReducer, createEmptyBook, visibleBooks } from '../domain/bookReducer';
import { filterAndSortBooks, paginate } from '../domain/filterBooks';
import { BookDetail } from '../components/BookDetail';
import { BookForm } from '../components/BookForm';
import { BookTable } from '../components/BookTable';
import { Filters } from '../components/Filters';
import { Presentation } from '../components/Presentation';
import { createBook, deleteBook, listBooks, updateBook } from '../services/booksApi';

const pageSize = 10;

const initialFilters = {
  query: '',
  status: 'All',
  genre: 'All',
  sortBy: 'title',
  direction: 'asc',
};

export function LibraryPage() {
  const { auth } = useAuth();
  const [books, dispatch] = useReducer(bookReducer, []);
  const [selectedId, setSelectedId] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [editingBook, setEditingBook] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeBooks = visibleBooks(books);
  const filteredBooks = useMemo(() => filterAndSortBooks(activeBooks, filters), [activeBooks, filters]);
  const paginated = paginate(filteredBooks, page, pageSize);
  const selectedBook = activeBooks.find((book) => book.id === selectedId) ?? paginated.items[0] ?? null;

  const stats = {
    total: activeBooks.length,
    reading: activeBooks.filter((book) => book.status === 'In Progress').length,
    lent: activeBooks.filter((book) => book.loan && !book.loan.isReturned).length,
  };

  const updateFilters = (nextFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  useEffect(() => {
    if (!auth?.token) {
      dispatch({ type: 'set', books: [] });
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setBooksLoading(true);
      setBooksError('');

      try {
        const loaded = await listBooks(auth.token);
        if (cancelled) return;
        dispatch({ type: 'set', books: loaded });
        setSelectedId(loaded[0]?.id ?? '');
        setPage(1);
      } catch (error) {
        if (!cancelled) setBooksError(error.message);
      } finally {
        if (!cancelled) setBooksLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth?.token]);

  const openCreateForm = () => {
    setEditingBook(createEmptyBook());
    setIsFormOpen(true);
  };

  const saveBook = async (book) => {
    if (!auth?.token) return;

    setIsSaving(true);
    setBooksError('');

    try {
      const saved = book.id ? await updateBook(auth.token, book.id, book) : await createBook(auth.token, book);
      if (book.id) {
        dispatch({ type: 'update', book: saved });
        setSelectedId(saved.id);
      } else {
        dispatch({ type: 'add', book: saved });
        setSelectedId(saved.id);
      }
      setIsFormOpen(false);
      setEditingBook(null);
      setPage(1);
    } catch (error) {
      setBooksError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const removeBook = async (id) => {
    if (!auth?.token) return;

    const book = activeBooks.find((candidate) => candidate.id === id);
    if (!book || !window.confirm(`Delete "${book.title}" from BookNest?`)) return;

    setBooksError('');

    try {
      await deleteBook(auth.token, id);
      dispatch({ type: 'delete', id });
      const nextBook = activeBooks.find((candidate) => candidate.id !== id);
      setSelectedId(nextBook?.id ?? '');
    } catch (error) {
      setBooksError(error.message);
    }
  };

  return (
    <>
      <Presentation />

      <section className="library-section" aria-labelledby="library-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Master/detail CRUD</p>
            <h2 id="library-title">My Library</h2>
          </div>
          <button className="button primary" type="button" onClick={openCreateForm}>
            <Plus size={18} aria-hidden="true" />
            Add book
          </button>
        </div>

        <div className="stats-row" aria-label="Library statistics">
          <strong>{stats.total}</strong>
          <span>Total books</span>
          <strong>{stats.reading}</strong>
          <span>Currently reading</span>
          <strong>{stats.lent}</strong>
          <span>Lent out</span>
        </div>

        <Filters filters={filters} onChange={updateFilters} />

        {booksError && <p className="auth-error" role="alert">{booksError}</p>}
        {booksLoading && <p className="eyebrow">Loading your library from the database…</p>}

        <div className="master-detail">
          <BookTable
            books={paginated.items}
            page={paginated.page}
            pageCount={paginated.pageCount}
            selectedId={selectedBook?.id}
            onPageChange={setPage}
            onSelect={setSelectedId}
          />
          <BookDetail
            book={selectedBook}
            onDelete={removeBook}
            onEdit={(book) => {
              setEditingBook(book);
              setIsFormOpen(true);
            }}
          />
        </div>
      </section>

      {isFormOpen && (
        <div className="form-overlay" role="dialog" aria-modal="true" aria-label="Book form">
          <div className="form-panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">{editingBook?.id ? 'Update entity' : 'Create entity'}</p>
                <h2>{editingBook?.id ? 'Edit book' : 'Add book'}</h2>
              </div>
            </div>
            <BookForm
              book={editingBook}
              isSubmitting={isSaving}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingBook(null);
              }}
              onSubmit={saveBook}
            />
          </div>
        </div>
      )}
    </>
  );
}
