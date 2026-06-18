import axiosClient from './axiosClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'VIP_EXPIRY' | 'RESERVATION_READY' | 'LOAN_EXPIRING' | 'FINE_ISSUED' | 'GENERAL';
  isRead: boolean;
  createdAt: string;
}

interface ApiResponse<T> {
  message: string;
  status: boolean;
  data: T;
}

// ─── SSE (Server-Sent Events) ─────────────────────────────────────────────────
//
// SSE là cơ chế browser tự động giữ kết nối HTTP mở để nhận data từ server.
// Khác với polling (gọi API định kỳ), SSE chỉ nhận khi server thực sự có data mới.
//
// Cách dùng:
//   const es = createNotificationEventSource();
//   es.addEventListener('NOTIFICATION', (e) => { ... });
//   // Khi cleanup: es.close();
//
// EventSource tự động reconnect khi mất kết nối (built-in browser behaviour).

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Tạo EventSource kết nối tới SSE endpoint của backend.
 *
 * Vì EventSource không hỗ trợ custom headers, ta dùng kết nối có
 * `withCredentials: true` để browser tự gửi kèm cookie (JWT).
 *
 * @returns EventSource đang mở kết nối SSE với /api/notifications/subscribe
 */
export function createNotificationEventSource(): EventSource {
  // withCredentials: true → browser gửi kèm cookie (JWT accessToken) theo request SSE
  return new EventSource(`${apiBaseUrl}/api/notifications/subscribe`, {
    withCredentials: true,
  });
}

// ─── REST API calls ───────────────────────────────────────────────────────────

/** Lấy toàn bộ danh sách thông báo của user hiện tại (dùng lần load đầu). */
export const getMyNotifications = async (): Promise<NotificationItem[]> => {
  const { data } = await axiosClient.get<ApiResponse<NotificationItem[]>>('/notifications');
  return data.data ?? [];
};

/** Đánh dấu một thông báo đơn lẻ là đã đọc. */
export const markNotificationRead = async (id: number): Promise<void> => {
  await axiosClient.put<ApiResponse<void>>(`/notifications/${id}/read`);
};

/** Đánh dấu tất cả thông báo là đã đọc. */
export const markAllNotificationsRead = async (): Promise<void> => {
  await axiosClient.put<ApiResponse<void>>('/notifications/read-all');
};
