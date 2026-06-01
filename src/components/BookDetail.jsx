import { Edit, Trash2 } from 'lucide-react';
import { progressPercent } from '../domain/bookValidation';

export function BookDetail({ book, onDelete, onEdit }) {
  if (!book) {
    return (
      <aside className="detail-panel empty-state" aria-label="Book details">
        <p>Select a row to inspect its full metadata, progress, notes, and lending status.</p>
      </aside>
    );
  }

  const progress = progressPercent(book);
  const loanLabel = book.loan && !book.loan.isReturned ? `${book.loan.borrowerName} since ${book.loan.loanDate}` : 'Available';

  return (
    <aside className="detail-panel" aria-label={`${book.title} details`}>
      <div className="detail-header">
        <img src={book.coverUrl} alt={`${book.title} cover`} />
        <div>
          <p className="eyebrow">{book.genre || 'Uncategorized'}</p>
          <h2>{book.title}</h2>
          <p>by {book.author}</p>
        </div>
      </div>

      <dl className="metadata">
        <div>
          <dt>Status</dt>
          <dd>{book.status}</dd>
        </div>
        <div>
          <dt>Rating</dt>
          <dd>{book.rating ? `${book.rating}/5` : 'Not rated'}</dd>
        </div>
        <div>
          <dt>ISBN</dt>
          <dd>{book.isbn || 'Not provided'}</dd>
        </div>
        <div>
          <dt>Lending</dt>
          <dd>{loanLabel}</dd>
        </div>
      </dl>

      <div className="progress-block">
        <div className="progress-label">
          <span>Reading progress</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-track" aria-label={`${progress}% read`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <p>
          {book.currentPage} of {book.totalPages} pages
        </p>
      </div>

      <section>
        <h3>Notes</h3>
        <p>{book.notes || 'No notes yet.'}</p>
      </section>

      <div className="detail-actions">
        <button className="button secondary" type="button" onClick={() => onEdit(book)}>
          <Edit size={18} aria-hidden="true" />
          Edit
        </button>
        <button className="button danger" type="button" onClick={() => onDelete(book.id)}>
          <Trash2 size={18} aria-hidden="true" />
          Delete
        </button>
      </div>
    </aside>
  );
}
