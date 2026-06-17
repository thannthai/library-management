import axiosClient from './axiosClient';

interface ApiResponse<T> {
  message: string;
  status: boolean;
  data: T;
}

/**
 * Giả lập webhook thanh toán thành công của SePay cục bộ.
 * Nhận vào txnRef (mã giao dịch, ví dụ "SUB987849496" hoặc "BL1012345678").
 */
export const simulatePayment = async (txnRef: string): Promise<any> => {
  const { data } = await axiosClient.post<ApiResponse<any>>('/payments/sepay/simulate', {
    txnRef,
  });
  return data;
};
