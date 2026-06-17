import axiosClient from './axiosClient';

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

export const getMyNotifications = async (): Promise<NotificationItem[]> => {
  const { data } = await axiosClient.get<ApiResponse<NotificationItem[]>>('/notifications');
  return data.data ?? [];
};

export const markNotificationRead = async (id: number): Promise<void> => {
  await axiosClient.put<ApiResponse<void>>(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await axiosClient.put<ApiResponse<void>>('/notifications/read-all');
};
