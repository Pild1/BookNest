import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { genres, statuses } from '../data/books';
import { createEmptyBook } from '../domain/bookReducer';
import { validateBook } from '../domain/bookValidation';

export function BookForm({ book, onCancel, onSubmit, isSubmitting = false }) {
  const [draft, setDraft] = useState(book ?? createEmptyBook());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setDraft(book ?? createEmptyBook());
    setErrors({});
  }, [book]);

  const updateField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = validateBook(draft);
    setErrors(result.errors);
    if (result.isValid) onSubmit(result.book);
  };

  return (
    <form className="book-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <label>
          <span>Title</span>
          <input aria-label="Title" value={draft.title} onChange={(event) => updateField('title', event.target.value)} />
          {errors.title && <small role="alert">{errors.title}</small>}
        </label>
        <label>
          <span>Author</span>
          <input aria-label="Author" value={draft.author} onChange={(event) => updateField('author', event.target.value)} />
          {errors.author && <small role="alert">{errors.author}</small>}
        </label>
        <label>
          <span>ISBN</span>
          <input aria-label="ISBN" value={draft.isbn} onChange={(event) => updateField('isbn', event.target.value)} />
        </label>
        <label>
          <span>Genre</span>
          <select aria-label="Genre" value={draft.genre} onChange={(event) => updateField('genre', event.target.value)}>
            <option value="">Uncategorized</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>
        <label className="wide">
          <span>Cover URL</span>
          <input aria-label="Cover URL" value={draft.coverUrl} onChange={(event) => updateField('coverUrl', event.target.value)} />
          {errors.coverUrl && <small role="alert">{errors.coverUrl}</small>}
        </label>
        <label>
          <span>Status</span>
          <select aria-label="Status" value={draft.status} onChange={(event) => updateField('status', event.target.value)}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {errors.status && <small role="alert">{errors.status}</small>}
        </label>
        <label>
          <span>Total pages</span>
          <input
            type="number"
            aria-label="Total pages"
            min="1"
            value={draft.totalPages}
            onChange={(event) => updateField('totalPages', event.target.value)}
          />
          {errors.totalPages && <small role="alert">{errors.totalPages}</small>}
        </label>
        <label>
          <span>Current page</span>
          <input
            type="number"
            aria-label="Current page"
            min="0"
            value={draft.currentPage}
            onChange={(event) => updateField('currentPage', event.target.value)}
          />
          {errors.currentPage && <small role="alert">{errors.currentPage}</small>}
        </label>
        <label>
          <span>Rating</span>
          <select aria-label="Rating" value={draft.rating ?? ''} onChange={(event) => updateField('rating', event.target.value)}>
            <option value="">No rating</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
          {errors.rating && <small role="alert">{errors.rating}</small>}
        </label>
        <label className="wide">
          <span>Personal notes</span>
          <textarea aria-label="Personal notes" value={draft.notes} onChange={(event) => updateField('notes', event.target.value)} rows="4" />
        </label>
      </div>
      <div className="form-actions">
        <button className="button secondary" type="button" onClick={onCancel}>
          <X size={18} aria-hidden="true" />
          Cancel
        </button>
        <button className="button primary" type="submit" disabled={isSubmitting}>
          <Check size={18} aria-hidden="true" />
          {isSubmitting ? 'Saving…' : 'Save book'}
        </button>
      </div>
    </form>
  );
}
