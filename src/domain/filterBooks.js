export function filterAndSortBooks(books, filters) {
  const query = filters.query.trim().toLowerCase();

  return [...books]
    .filter((book) => {
      const matchesQuery =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query);
      const matchesStatus = filters.status === 'All' || book.status === filters.status;
      const matchesGenre = filters.genre === 'All' || book.genre === filters.genre;
      return matchesQuery && matchesStatus && matchesGenre;
    })
    .sort((a, b) => {
      const direction = filters.direction === 'desc' ? -1 : 1;
      if (filters.sortBy === 'rating') {
        return ((a.rating || 0) - (b.rating || 0)) * direction;
      }
      return String(a[filters.sortBy] || '').localeCompare(String(b[filters.sortBy] || '')) * direction;
    });
}

export function paginate(items, page, pageSize) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageCount,
    items: items.slice(start, start + pageSize),
  };
}
