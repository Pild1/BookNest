export function createEmptyBook() {
  return {
    id: '',
    title: '',
    author: '',
    isbn: '',
    genre: '',
    coverUrl: '',
    totalPages: 1,
    currentPage: 0,
    status: 'Unread',
    rating: '',
    notes: '',
    isWishlist: false,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    loan: null,
  };
}

export function bookReducer(state, action) {
  switch (action.type) {
    case 'set':
      return action.books;
    case 'add':
      return [action.book, ...state];
    case 'update':
      return state.map((book) => (book.id === action.book.id ? { ...book, ...action.book } : book));
    case 'delete':
      return state.map((book) => (book.id === action.id ? { ...book, isDeleted: true } : book));
    default:
      return state;
  }
}

export function visibleBooks(books) {
  return books.filter((book) => !book.isDeleted && !book.isWishlist);
}
