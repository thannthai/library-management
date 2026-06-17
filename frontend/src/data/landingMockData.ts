import type { BookSpine, StatItem, ContactInfo, NavLink, Book, Genre } from '../types/landing.types';

// ─── Navigation ───────────────────────────────────────────────────────────────
export const NAV_LINKS: NavLink[] = [
  { label: 'Trang chủ', href: '#home' },
  { label: 'Giới thiệu', href: '#about' },
  { label: 'Duyệt sách', href: '/books', isPage: true },
  { label: 'Liên hệ', href: '#contact' },
];

// ─── Section IDs tracked by IntersectionObserver ─────────────────────────────
// 'featured' added so active state tracks all sections
export const LANDING_SECTION_IDS = ['home', 'about', 'featured', 'contact'];

// ─── Hero ─────────────────────────────────────────────────────────────────────
export const HERO_STATS: StatItem[] = [
  { value: '12,000+', label: 'Đầu sách' },
  { value: '5,800+',  label: 'Thành viên' },
  { value: '4.8★',    label: 'Đánh giá' },
];

export const BOOK_SPINES: BookSpine[] = [
  { id: 's1', title: 'Đắc Nhân Tâm',  color: '#6366f1', accentColor: '#818cf8', heightClass: 'h-44' },
  { id: 's2', title: 'Nhà Giả Kim',   color: '#8b5cf6', accentColor: '#a78bfa', heightClass: 'h-56' },
  { id: 's3', title: 'Atomic Habits', color: '#c7d2fe', accentColor: '#e0e7ff', heightClass: 'h-48' },
  { id: 's4', title: 'Sapiens',       color: '#d1d5db', accentColor: '#e5e7eb', heightClass: 'h-36' },
  { id: 's5', title: 'Think Again',   color: '#4f46e5', accentColor: '#6366f1', heightClass: 'h-52' },
  { id: 's6', title: 'Power of Habit',color: '#7c3aed', accentColor: '#8b5cf6', heightClass: 'h-40' },
];

// ─── About Stats ──────────────────────────────────────────────────────────────
export const ABOUT_STATS: StatItem[] = [
  { value: '2018',     label: 'Năm thành lập' },
  { value: '12,000+', label: 'Đầu sách' },
  { value: '5,800+',  label: 'Thành viên' },
];

// ─── Contact Info ─────────────────────────────────────────────────────────────
export const CONTACT_INFO: ContactInfo[] = [
  { icon: 'MapPin',   label: 'Địa chỉ',    value: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh' },
  { icon: 'Phone',    label: 'Hotline',    value: '1800 1234 (miễn phí)' },
  { icon: 'Envelope', label: 'Email',      value: 'hello@booknest.vn' },
  { icon: 'Clock',    label: 'Giờ mở cửa',value: 'Thứ 2 - Chủ nhật: 08:00 - 21:00' },
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
    genre: 'Kỹ năng sống',
    genreColor: 'violet',
    borrowCount: 1200,
    coverSeed: 'dac-nhan-tam',
    coverBg: '#f3e8ff',
    description: 'Cuốn sách kinh điển về nghệ thuật đối nhân xử thế, giúp bạn chinh phục lòng người và xây dựng các mối quan hệ bền chặt trong cuộc sống lẫn công việc. Những nguyên tắc Dale Carnegie chia sẻ vẫn còn nguyên giá trị sau hàng thập kỷ.',
  },
  {
    id: 'b02',
    title: 'Nhà Giả Kim',
    author: 'Paulo Coelho',
    genre: 'Tiểu thuyết',
    genreColor: 'orange',
    borrowCount: 980,
    coverSeed: 'nha-gia-kim',
    coverBg: '#fff7ed',
    description: 'Hành trình của chàng chăn cừu Santiago đi tìm kho báu huyền thoại — một câu chuyện về ước mơ, số phận và ý nghĩa của cuộc sống. Tác phẩm bán chạy nhất mọi thời đại của Paulo Coelho.',
  },
  {
    id: 'b03',
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Kỹ năng sống',
    genreColor: 'violet',
    borrowCount: 1500,
    coverSeed: 'atomic-habits',
    coverBg: '#ecfdf5',
    description: 'Hệ thống xây dựng thói quen nhỏ mang lại kết quả lớn. James Clear chứng minh rằng chỉ cần cải thiện 1% mỗi ngày, bạn có thể tạo ra sự thay đổi phi thường trong cuộc đời — áp dụng được ngay từ hôm nay.',
  },
  {
    id: 'b04',
    title: 'Think Again',
    author: 'Adam Grant',
    genre: 'Tâm lý',
    genreColor: 'blue',
    borrowCount: 860,
    coverSeed: 'think-again',
    coverBg: '#eff6ff',
    description: 'Adam Grant khuyến khích chúng ta suy nghĩ lại những điều mình cho là đúng. Trong thế giới biến đổi không ngừng, khả năng thay đổi tư duy và học hỏi lại là kỹ năng quan trọng hơn bao giờ hết.',
  },
  {
    id: 'b05',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    genre: 'Lịch sử',
    genreColor: 'amber',
    borrowCount: 1100,
    coverSeed: 'sapiens-book',
    coverBg: '#fefce8',
    description: 'Lược sử loài người từ thời đồ đá đến thế kỷ 21. Harari lý giải vì sao Homo sapiens thống trị Trái Đất, cách các huyền thoại tập thể định hình xã hội và những thách thức loài người đang đối mặt.',
  },
  {
    id: 'b06',
    title: 'The Power of Habit',
    author: 'Charles Duhigg',
    genre: 'Kinh tế',
    genreColor: 'yellow',
    borrowCount: 745,
    coverSeed: 'power-habit',
    coverBg: '#fefce8',
    description: 'Khoa học đằng sau thói quen và cách chúng định hình cuộc sống, công việc và xã hội. Charles Duhigg chỉ ra vòng lặp thói quen và cách thay đổi nó để đạt được thành công bền vững.',
  },
  {
    id: 'b07',
    title: 'Tư duy nhanh và chậm',
    author: 'Daniel Kahneman',
    genre: 'Tâm lý',
    genreColor: 'blue',
    borrowCount: 689,
    coverSeed: 'thinking-fast',
    coverBg: '#f0f9ff',
    description: 'Tiến sĩ Kahneman giải thích hai hệ thống tư duy: tư duy nhanh (bản năng, cảm xúc) và tư duy chậm (lý trí, có chủ đích). Hiểu được cách não bộ vận hành giúp bạn đưa ra quyết định sáng suốt hơn.',
  },
  {
    id: 'b08',
    title: 'Không gia đình',
    author: 'Hector Malot',
    genre: 'Tiểu thuyết',
    genreColor: 'orange',
    borrowCount: 512,
    coverSeed: 'family-novel',
    coverBg: '#fff7ed',
    description: 'Câu chuyện cảm động về cậu bé Rémi mồ côi phiêu bạt khắp nước Pháp cùng người nghệ sĩ già Vitalis. Tác phẩm kinh điển về tình người, lòng dũng cảm và ý chí vươn lên trong nghịch cảnh.',
  },
];

// ─── Featured Books (4 cuốn nổi bật cho Landing Page) ────────────────────────
export const FEATURED_BOOKS: Book[] = MOCK_BOOKS.slice(0, 4);

// ─── Genre list ───────────────────────────────────────────────────────────────
export const GENRES: Genre[] = [
  { label: 'Tất cả thể loại', count: 2456 },
  { label: 'Tiểu thuyết',     count: 1234 },
  { label: 'Kỹ năng sống',    count: 856  },
  { label: 'Kinh tế',         count: 642  },
  { label: 'Tâm lý',          count: 532  },
  { label: 'Khoa học',        count: 421  },
  { label: 'Lịch sử',         count: 312  },
  { label: 'Khác',            count: 231  },
];

export const AUTHORS = [
  'Dale Carnegie', 'Paulo Coelho', 'James Clear', 'Adam Grant',
  'Yuval Noah Harari', 'Charles Duhigg', 'Daniel Kahneman', 'Hector Malot',
];
