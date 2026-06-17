// ─── Dashboard Mock Data ──────────────────────────────────────────────────────

export interface LoanBook {
  id: string;
  title: string;
  author: string;
  coverBg: string;
  coverSeed: string;
  dueDate: string;       // ISO date string
  daysRemaining: number;
  status: 'CHECKED_OUT' | 'OVERDUE' | 'RETURNED';
}

export interface ReservationBook {
  id: string;
  title: string;
  author: string;
  coverBg: string;
  coverSeed: string;
  queuePosition: number;
  estimatedWait: string; // e.g. "~3 days"
  reservedDate: string;
}

export interface HistoryBook {
  id: string;
  title: string;
  author: string;
  coverBg: string;
  coverSeed: string;
  returnedDate: string;
  rating?: number; // 1-5
}

export interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  genre: string;
  coverBg: string;
  coverSeed: string;
  reason: string;
}

// ─── Current Loans ────────────────────────────────────────────────────────────
export const MOCK_CURRENT_LOANS: LoanBook[] = [
  {
    id: 'l1',
    title: 'The Lean Startup',
    author: 'Eric Ries',
    coverBg: '#ecfdf5',
    coverSeed: 'lean-startup',
    dueDate: '2026-06-20',
    daysRemaining: 14,
    status: 'CHECKED_OUT',
  },
  {
    id: 'l2',
    title: 'Human Resource Management',
    author: 'Gary Dessler',
    coverBg: '#eff6ff',
    coverSeed: 'hr-management',
    dueDate: '2026-06-18',
    daysRemaining: 12,
    status: 'CHECKED_OUT',
  },
  {
    id: 'l3',
    title: 'Deep Work',
    author: 'Cal Newport',
    coverBg: '#f0f9ff',
    coverSeed: 'deep-work',
    dueDate: '2026-06-10',
    daysRemaining: 4,
    status: 'CHECKED_OUT',
  },
];

// ─── Reservations ─────────────────────────────────────────────────────────────
export const MOCK_RESERVATIONS: ReservationBook[] = [
  {
    id: 'r1',
    title: 'Atomic Habits',
    author: 'James Clear',
    coverBg: '#ecfdf5',
    coverSeed: 'atomic-habits-res',
    queuePosition: 2,
    estimatedWait: '~3 days',
    reservedDate: '2026-06-01',
  },
  {
    id: 'r2',
    title: 'Zero to One',
    author: 'Peter Thiel',
    coverBg: '#faf5ff',
    coverSeed: 'zero-to-one',
    queuePosition: 5,
    estimatedWait: '~2 weeks',
    reservedDate: '2026-06-03',
  },
];

// ─── Reading History ──────────────────────────────────────────────────────────
export const MOCK_READING_HISTORY: HistoryBook[] = [
  {
    id: 'h1',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    coverBg: '#fefce8',
    coverSeed: 'sapiens-hist',
    returnedDate: '2026-05-28',
    rating: 5,
  },
  {
    id: 'h2',
    title: 'Đắc Nhân Tâm',
    author: 'Dale Carnegie',
    coverBg: '#f3e8ff',
    coverSeed: 'dac-nhan-tam-hist',
    returnedDate: '2026-05-10',
    rating: 4,
  },
  {
    id: 'h3',
    title: 'Nhà Giả Kim',
    author: 'Paulo Coelho',
    coverBg: '#fff7ed',
    coverSeed: 'nha-gia-kim-hist',
    returnedDate: '2026-04-22',
    rating: 5,
  },
  {
    id: 'h4',
    title: 'Think Again',
    author: 'Adam Grant',
    coverBg: '#eff6ff',
    coverSeed: 'think-again-hist',
    returnedDate: '2026-04-05',
    rating: 4,
  },
];

// ─── Recommendations ──────────────────────────────────────────────────────────
export const MOCK_RECOMMENDATIONS: RecommendedBook[] = [
  {
    id: 'rec1',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    genre: 'Finance',
    coverBg: '#fefce8',
    coverSeed: 'psychology-money',
    reason: 'Because you read Sapiens',
  },
  {
    id: 'rec2',
    title: 'Range',
    author: 'David Epstein',
    genre: 'Self Help',
    coverBg: '#f0fdf4',
    coverSeed: 'range-book',
    reason: 'Trending in your area',
  },
  {
    id: 'rec3',
    title: 'Outliers',
    author: 'Malcolm Gladwell',
    genre: 'Psychology',
    coverBg: '#fdf4ff',
    coverSeed: 'outliers',
    reason: 'Popular this week',
  },
  {
    id: 'rec4',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    genre: 'Fiction',
    coverBg: '#eff6ff',
    coverSeed: 'midnight-library',
    reason: 'Readers also loved',
  },
];

// ─── Reading Goal ─────────────────────────────────────────────────────────────
export const READING_GOAL = {
  year: 2026,
  target: 30,
  completed: 7, // books read so far
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const DASHBOARD_STATS = {
  currentLoans: MOCK_CURRENT_LOANS.length,
  reservations: MOCK_RESERVATIONS.length,
  booksRead: READING_GOAL.completed,
  dayStreak: 7,
};
