import type { BookSpine, StatItem, ContactInfo, NavLink, Book, Genre } from '../types/landing.types';

// ─── Navigation ───────────────────────────────────────────────────────────────
export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Featured', href: '#featured' },
  { label: 'Contact', href: '#contact' },
];

// ─── Section IDs tracked by IntersectionObserver ─────────────────────────────
// 'featured' added so active state tracks all sections
export const LANDING_SECTION_IDS = ['home', 'about', 'featured', 'contact'];

// ─── Hero ─────────────────────────────────────────────────────────────────────
export const HERO_STATS: StatItem[] = [
  { value: '12,000+', label: 'Books' },
  { value: '5,800+',  label: 'Members' },
  { value: '4.8★',    label: 'Reviews' },
];

export const BOOK_SPINES: BookSpine[] = [
  { id: 's1', title: 'How to Win Friends',  color: '#6366f1', accentColor: '#818cf8', heightClass: 'h-44' },
  { id: 's2', title: 'The Alchemist',   color: '#8b5cf6', accentColor: '#a78bfa', heightClass: 'h-56' },
  { id: 's3', title: 'Atomic Habits', color: '#c7d2fe', accentColor: '#e0e7ff', heightClass: 'h-48' },
  { id: 's4', title: 'Sapiens',       color: '#d1d5db', accentColor: '#e5e7eb', heightClass: 'h-36' },
  { id: 's5', title: 'Think Again',   color: '#4f46e5', accentColor: '#6366f1', heightClass: 'h-52' },
  { id: 's6', title: 'Power of Habit',color: '#7c3aed', accentColor: '#8b5cf6', heightClass: 'h-40' },
];

// ─── About Stats ──────────────────────────────────────────────────────────────
export const ABOUT_STATS: StatItem[] = [
  { value: '2018',     label: 'Founded Year' },
  { value: '12,000+', label: 'Books' },
  { value: '5,800+',  label: 'Members' },
];

// ─── Contact Info ─────────────────────────────────────────────────────────────
export const CONTACT_INFO: ContactInfo[] = [
  { icon: 'MapPin',   label: 'Address',    value: '123 Nguyen Hue, District 1, Ho Chi Minh City' },
  { icon: 'Phone',    label: 'Hotline',    value: '1800 1234 (Toll-Free)' },
  { icon: 'Envelope', label: 'Email',      value: 'hello@booknest.vn' },
  { icon: 'Clock',    label: 'Opening Hours', value: 'Monday - Sunday: 08:00 - 21:00' },
];

// ─── Genre colors ─────────────────────────────────────────────────────────────
export const GENRE_COLOR_MAP: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-700',
  orange: 'bg-orange-100 text-orange-700',
  blue:   'bg-blue-100 text-blue-700',
  amber:  'bg-amber-100 text-amber-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  rose:   'bg-rose-100 text-rose-700',
};

// ─── All Books Mock Data ───────────────────────────────────────────────────────
export const MOCK_BOOKS: Book[] = [
  {
    id: 'b01',
    title: 'Đắc Nhân Tâm',
    author: 'Dale Carnegie',
    genre: 'Self-Help',
    genreColor: 'violet',
    borrowCount: 1200,
    coverSeed: 'dac-nhan-tam',
    coverBg: '#f3e8ff',
    description: "The classic book on interpersonal skills, helping you win people over and build strong relationships in life and work. Dale Carnegie's principles remain highly valuable after decades.",
  },
  {
    id: 'b02',
    title: 'Nhà Giả Kim',
    author: 'Paulo Coelho',
    genre: 'Fiction',
    genreColor: 'orange',
    borrowCount: 980,
    coverSeed: 'nha-gia-kim',
    coverBg: '#fff7ed',
    description: 'The journey of Santiago, an Andalusian shepherd boy, to find a legendary treasure — a story about dreams, destiny, and the meaning of life. Paulo Coelho\'s all-time bestseller.',
  },
  {
    id: 'b03',
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Self-Help',
    genreColor: 'violet',
    borrowCount: 1500,
    coverSeed: 'atomic-habits',
    coverBg: '#ecfdf5',
    description: 'An easy and proven way to build good habits and break bad ones. James Clear demonstrates that getting 1% better every day can lead to extraordinary change.',
  },
  {
    id: 'b04',
    title: 'Think Again',
    author: 'Adam Grant',
    genre: 'Psychology',
    genreColor: 'blue',
    borrowCount: 860,
    coverSeed: 'think-again',
    coverBg: '#eff6ff',
    description: 'Adam Grant encourages us to rethink what we take for granted. In a rapidly changing world, the ability to rethink and unlearn is a more critical skill than ever.',
  },
  {
    id: 'b05',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    genre: 'History',
    genreColor: 'amber',
    borrowCount: 1100,
    coverSeed: 'sapiens-book',
    coverBg: '#fefce8',
    description: 'A brief history of humankind from the Stone Age to the 21st century. Harari explains how Homo sapiens came to dominate the Earth, how myths shape societies, and the challenges we face.',
  },
  {
    id: 'b06',
    title: 'The Power of Habit',
    author: 'Charles Duhigg',
    genre: 'Business',
    genreColor: 'yellow',
    borrowCount: 745,
    coverSeed: 'power-habit',
    coverBg: '#fefce8',
    description: 'The science of habit formation and how habits shape our lives, organizations, and communities. Charles Duhigg explains the habit loop and how to change it for lasting success.',
  },
  {
    id: 'b07',
    title: 'Tư duy nhanh và chậm',
    author: 'Daniel Kahneman',
    genre: 'Psychology',
    genreColor: 'blue',
    borrowCount: 689,
    coverSeed: 'thinking-fast',
    coverBg: '#f0f9ff',
    description: 'Dr. Kahneman explains the two systems that drive the way we think: System 1 (fast, intuitive, emotional) and System 2 (slow, deliberative, logical). Understanding how the brain works helps you make better decisions.',
  },
  {
    id: 'b08',
    title: 'Không gia đình',
    author: 'Hector Malot',
    genre: 'Fiction',
    genreColor: 'orange',
    borrowCount: 512,
    coverSeed: 'family-novel',
    coverBg: '#fff7ed',
    description: 'The moving story of Rémi, an orphan boy who wanders across France with the old street performer Vitalis. A classic tale of human kindness, courage, and resilience in adversity.',
  },
];

// ─── Featured Books (4 cuốn nổi bật cho Landing Page) ────────────────────────
export const FEATURED_BOOKS: Book[] = MOCK_BOOKS.slice(0, 4);

// ─── Genre list ───────────────────────────────────────────────────────────────
export const GENRES: Genre[] = [
  { label: 'All Genres', count: 2456 },
  { label: 'Fiction',     count: 1234 },
  { label: 'Self-Help',    count: 856  },
  { label: 'Business',         count: 642  },
  { label: 'Psychology',          count: 532  },
  { label: 'Science',        count: 421  },
  { label: 'History',        count: 312  },
  { label: 'Others',            count: 231  },
];

export const AUTHORS = [
  'Dale Carnegie', 'Paulo Coelho', 'James Clear', 'Adam Grant',
  'Yuval Noah Harari', 'Charles Duhigg', 'Daniel Kahneman', 'Hector Malot',
];
