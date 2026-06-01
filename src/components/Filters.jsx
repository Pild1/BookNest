import { ArrowDownAZ, ArrowUpAZ, Search } from 'lucide-react';
import { genres, statuses } from '../data/books';

export function Filters({ filters, onChange }) {
  const update = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <section className="filters" aria-label="Library filters">
      <label className="search-field">
        <Search size={18} aria-hidden="true" />
        <input
          value={filters.query}
          placeholder="Search by title or author"
          onChange={(event) => update('query', event.target.value)}
        />
      </label>
      <label>
        <span>Status</span>
        <select value={filters.status} onChange={(event) => update('status', event.target.value)}>
          <option>All</option>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Genre</span>
        <select value={filters.genre} onChange={(event) => update('genre', event.target.value)}>
          <option>All</option>
          {genres.map((genre) => (
            <option key={genre}>{genre}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Sort</span>
        <select value={filters.sortBy} onChange={(event) => update('sortBy', event.target.value)}>
          <option value="title">Title</option>
          <option value="author">Author</option>
          <option value="genre">Genre</option>
          <option value="rating">Rating</option>
        </select>
      </label>
      <button
        className="icon-button"
        type="button"
        onClick={() => update('direction', filters.direction === 'asc' ? 'desc' : 'asc')}
        aria-label="Toggle sort direction"
        title="Toggle sort direction"
      >
        {filters.direction === 'asc' ? <ArrowDownAZ size={18} /> : <ArrowUpAZ size={18} />}
      </button>
    </section>
  );
}
