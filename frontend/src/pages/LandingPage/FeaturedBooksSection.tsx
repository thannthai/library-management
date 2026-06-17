import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, BookmarkSimple, Books } from '@phosphor-icons/react';
import { FEATURED_BOOKS, GENRE_COLOR_MAP } from '../../data/landingMockData';
import type { Book } from '../../types/landing.types';

// ─── Single Featured Card ─────────────────────────────────────────────────────
function FeaturedCard({ book, index }: { book: Book; index: number }) {
  const navigate     = useNavigate();
  const reduce       = useReducedMotion();
  const pillCls      = GENRE_COLOR_MAP[book.genreColor] ?? 'bg-slate-100 text-slate-600';
  const imgUrl       = `https://picsum.photos/seed/${book.coverSeed}/240/320`;
  const borrowStr    = book.borrowCount >= 1000
    ? `${(book.borrowCount / 1000).toFixed(1)}k`
    : String(book.borrowCount);

  const handleClick = () => {
    // Navigate to /books and auto-filter by genre
    navigate(`/books?category=${encodeURIComponent(book.genre)}`);
  };

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay: 0.06 * index, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleClick}
      className="group cursor-pointer flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60 transition-all duration-300"
    >
      {/* Cover */}
      <div className="relative overflow-hidden aspect-[3/4]" style={{ background: book.coverBg }}>
        <img
          src={imgUrl}
          alt={book.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-400"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur-sm text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
            Xem chi tiết <ArrowRight size={11} weight="bold" />
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200">
          {book.title}
        </h3>
        <p className="text-xs text-slate-400">{book.author}</p>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${pillCls}`}>
            {book.genre}
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <BookmarkSimple size={11} />
            {borrowStr} lượt mượn
          </span>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Featured Books Section ───────────────────────────────────────────────────
export default function FeaturedBooksSection() {
  const navigate = useNavigate();
  const reduce   = useReducedMotion();

  return (
    <section id="featured" className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-24">

        {/* Header */}
        <div className="flex items-end justify-between mb-10 gap-4">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Books size={15} weight="bold" className="text-indigo-600" />
              </div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Nổi bật
              </span>
            </div>
            <h2 className="text-[1.65rem] font-extrabold text-slate-900 tracking-tight">
              Sách nổi bật
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-[40ch]">
              Những tựa sách được mượn nhiều nhất trong tháng này
            </p>
          </motion.div>

          {/* "Xem tất cả" link on desktop */}
          <motion.button
            type="button"
            onClick={() => navigate('/books')}
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="hidden sm:flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors shrink-0 group"
          >
            Xem tất cả
            <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </motion.button>
        </div>

        {/* 4-column card grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {FEATURED_BOOKS.map((book, i) => (
            <FeaturedCard key={book.id} book={book} index={i} />
          ))}
        </div>

        {/* CTA button */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mt-10"
        >
          <button
            type="button"
            onClick={() => navigate('/books')}
            className="cursor-pointer inline-flex items-center gap-2.5 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-300/35 hover:shadow-indigo-400/45 active:scale-[0.97] group"
          >
            <Books size={16} weight="bold" />
            Xem toàn bộ kho sách
            <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
