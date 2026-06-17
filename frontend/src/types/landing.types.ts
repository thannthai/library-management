// ─── Book Types ─────────────────────────────────────────────────────────────

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  genreColor: string;
  borrowCount: number;
  coverSeed: string;
  coverBg: string;
  description: string; // tóm tắt nội dung
}

export interface Genre {
  label: string;
  count: number;
}

// ─── Landing Page Types ──────────────────────────────────────────────────────

export interface BookSpine {
  id: string;
  title: string;
  color: string;
  accentColor: string;
  heightClass: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface ContactInfo {
  icon: string;
  label: string;
  value: string;
}

export interface NavLink {
  label: string;
  href: string;
  isPage?: boolean; // true = React Router Link, false = scroll section
}
