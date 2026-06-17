export interface SubscriptionPlan {
  id: number;
  planCode: string;
  name: string;
  description: string;
  price: number;
  durationInDays: number;
  maxBooksAllowed: number;
  maxDaysPerBook: number;
  autoRenew: boolean;
  features: string[];
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  badgeText: string | null;
  adminNotes: string | null;
}

export interface SePayCheckout {
  checkoutFormUrl: string;
  params: Record<string, string>;
  qrCodeUrl?: string;
  bankCode?: string;
  bankAccount?: string;
  description?: string;
  amount?: number;
}

export interface Subscription {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  subscriptionPlanId: number;
  planName: string;
  planCode: string;
  price: number;
  maxBooksAllowed: number;
  maxDaysPerBook: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
  cancelledAt: string | null;
  cancellationReason: string | null;
  daysRemaining: number;
  isValid: boolean;
  isExpired: boolean;
  paymentId: number | null;
  paymentTransactionId: number | null;
  txnRef: string | null;
  paymentAmount: number | null;
  sePayCheckout: SePayCheckout | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRequest {
  subscriptionPlanId: number;
  autoRenew: boolean;
}
