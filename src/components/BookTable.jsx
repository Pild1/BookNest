import { ChevronLeft, ChevronRight } from 'lucide-react';
import { progressPercent } from '../domain/bookValidation';

export function BookTable({ books, page, pageCount, selectedId, onPageChange, onSelect }) {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Cover</th>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>Status</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr
              key={book.id}
              className={book.id === selectedId ? 'selected' : ''}
              onClick={() => onSelect(book.id)}
              tabIndex="0"
              onKeyDown={(event) => {
                if (event.key === 'Enter') onSelect(book.id);
              }}
            >
              <td>
                <img className="cover-thumb" src={book.coverUrl} alt="" />
              </td>
              <td>
                <strong>{book.title}</strong>
                {book.loan && !book.loan.isReturned && <span className="loan-pill">Lent</span>}
              </td>
              <td>{book.author}</td>
              <td>{book.genre || 'Uncategorized'}</td>
              <td>
                <span className="status-pill">{book.status}</span>
                {book.status === 'In Progress' && <small>{progressPercent(book)}%</small>}
              </td>
              <td>{book.rating ? '★'.repeat(book.rating) : 'Not rated'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {books.length === 0 && <p className="empty-table">No books match the current filters.</p>}
      <div className="pagination" aria-label="Pagination">
        <button
          className="icon-button"
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <span>
          Page {page} of {pageCount}
        </span>
        <button
          className="icon-button"
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pageCount}
          aria-label="Next page"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
