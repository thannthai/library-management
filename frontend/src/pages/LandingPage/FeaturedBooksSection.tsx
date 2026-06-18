import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { ArrowRight, BookmarkSimple, Books, CircleNotch } from '@phosphor-icons/react';
import { getFeaturedBooks } from '../../api/booksApi';
import type { BookResponse } from '../../types/books.types';

// Helper to clean and build Google Books cover image URLs
const getGoogleBooksUrl = (url: string | undefined, zoom: number): string | undefined => {
  if (!url) return undefined;
  if (url.includes('google.com/books') || url.includes('books.google.com')) {
    const cleanUrl = url.replace('http://', 'https://');
    if (/zoom=\d+/.test(cleanUrl)) {
      return cleanUrl.replace(/zoom=\d+/, `zoom=${zoom}`);
    } else {
      const separator = cleanUrl.includes('?') ? '&' : '?';
      return `${cleanUrl}${separator}zoom=${zoom}`;
    }
  }
  return url;
};

// ─── Single Featured Card ─────────────────────────────────────────────────────
interface FeaturedCardProps {
  book: BookResponse;
  index: number;
}

function FeaturedCard({ book, index }: FeaturedCardProps) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const authorStr = book.authors && book.authors.length > 0
    ? book.authors.map((a) => a.name).join(', ')
    : 'Unknown Author';

  const genreName = book.genres && book.genres.length > 0
    ? book.genres[0].name
    : 'General';

  const borrowNumber = book.borrowNumber || 0;
  const borrowStr = borrowNumber >= 1000
    ? `${(borrowNumber / 1000).toFixed(1)}k`
    : String(borrowNumber);

  const imgUrl = getGoogleBooksUrl(book.coverImageUrl, 2)
    || `https://picsum.photos/seed/${encodeURIComponent(book.title)}/240/320`;

  return (
    <motion.article
      layout
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group cursor-pointer flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden
        hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/60 transition-all duration-300 h-full"
      onClick={() => navigate(`/books`)}
    >
      {/* Cover */}
      <div className="relative overflow-hidden bg-slate-50" style={{ aspectRatio: '3/4' }}>
        <img
          src={imgUrl}
          alt={book.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
        />
        {/* Rank badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-sm text-indigo-600 shadow-sm border border-indigo-100">
            #{index + 1} Popular
          </span>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/12 transition-colors duration-300 flex items-end justify-center pb-4">
          <span className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-250 bg-white/95 backdrop-blur-sm text-indigo-700 text-[11px] font-bold px-4 py-2 rounded-full shadow-md flex items-center gap-1.5">
            View Details <ArrowRight size={10} weight="bold" />
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 flex-grow justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors duration-200">
            {book.title}
          </h3>
          <p className="text-[11.5px] text-slate-400 line-clamp-1">{authorStr}</p>
        </div>
        <div className="flex items-center justify-between gap-2 mt-2 pt-2.5 border-t border-slate-50">
          <span className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 truncate max-w-[100px]">
            {genreName}
          </span>
          <span className="text-[10.5px] text-slate-400 flex items-center gap-1 shrink-0">
            <BookmarkSimple size={10} />
            {borrowStr} borrows
          </span>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Featured Books Section ───────────────────────────────────────────────────
export default function FeaturedBooksSection() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch top borrowed books from backend
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setIsLoading(true);
        const data = await getFeaturedBooks();
        setBooks(data);
      } catch (err: any) {
        console.error('Failed to load featured books:', err);
        setError(err.message || 'Unable to load featured books.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Display only up to 4 books
  const displayedBooks = books.slice(0, 4);

  return (
    <section
      id="featured"
      style={{
        background: 'linear-gradient(160deg, #f8f9ff 0%, #f0f4ff 50%, #f5f3ff 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-24">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-[1.75rem] font-extrabold text-slate-900 tracking-tight">
              Featured Books
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 max-w-[40ch]">
              Our most-borrowed titles — handpicked for curious readers
            </p>
          </motion.div>

          <motion.button
            type="button"
            onClick={() => navigate('/books')}
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="hidden sm:flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors shrink-0 group"
          >
            View All
            <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </motion.button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <CircleNotch size={30} className="animate-spin text-indigo-500" />
            <p className="text-sm text-slate-400">Loading featured books...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-sm text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl p-6">
            {error}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400 bg-white/60 border border-slate-100 rounded-2xl p-6">
            No featured books available.
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {displayedBooks.map((book, i) => (
                <FeaturedCard key={book.id} book={book} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* CTA Button */}
        {!isLoading && !error && books.length > 0 && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center mt-12"
          >
            <button
              type="button"
              onClick={() => navigate('/books')}
              className="cursor-pointer inline-flex items-center gap-2.5 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-300/40 hover:shadow-indigo-400/50 active:scale-[0.97] group"
            >
              <Books size={16} weight="bold" />
              Browse All Books
              <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
