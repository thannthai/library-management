import axiosClient from './axiosClient';
import type { SubscriptionPlan, Subscription, SubscriptionRequest } from '../types/subscription.types';

// Spring Boot standard wrapper response interface
interface ApiResponse<T> {
  message: string;
  status: boolean;
  data: T;
}

/**
 * Fetch all available subscription plans.
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const { data } = await axiosClient.get<ApiResponse<SubscriptionPlan[]>>('/subscription-plans');
  return data.data;
};

/**
 * Create/Switch subscription plan.
 * Returns checkout info if it's a paid plan.
 */
export const subscribeToPlan = async (payload: SubscriptionRequest): Promise<Subscription> => {
  const { data } = await axiosClient.post<ApiResponse<Subscription>>('/subscriptions/subscribe', payload);
  return data.data;
};

/**
 * Retrieve the active subscription of the current user.
 * Note: The API technically takes a userId parameter, but resolves it via Spring Security context on the server side.
 */
export const getActiveSubscription = async (userId: number): Promise<Subscription> => {
  const { data } = await axiosClient.post<ApiResponse<Subscription>>('/subscriptions/user/active', null, {
    params: { userId },
  });
  return data.data;
};

/**
 * Cancel an active subscription.
 */
export const cancelSubscription = async (subscriptionId: number, reason?: string): Promise<Subscription> => {
  const { data } = await axiosClient.post<ApiResponse<Subscription>>(`/subscriptions/cancel/${subscriptionId}`, null, {
    params: { reason },
  });
  return data.data;
};

/**
 * Fetch all subscriptions (Admin only).
 */
export const getAllSubscriptions = async (page = 0, size = 1000): Promise<Subscription[]> => {
  const { data } = await axiosClient.get<ApiResponse<Subscription[]>>('/subscriptions/admin', {
    params: { page, size },
  });
  return data.data;
};
