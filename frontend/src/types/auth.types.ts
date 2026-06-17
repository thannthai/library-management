/**
 * auth.types.ts
 * ─────────────────────────────────────────────────────────────
 * Centralized TypeScript contract for all Authentication-related
 * data shapes. Import from here across the entire app.
 * ─────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════
// ENTITIES
// ═══════════════════════════════════════════════════════════════

/** Represents the authenticated user stored in global state. */
export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  roles: string[];
  isVerified: boolean;
  role: 'ADMIN' | 'LIBRARIAN' | 'MEMBER' | string;
  username?: string; // Optional for compatibility
}

// ═══════════════════════════════════════════════════════════════
// REQUEST PAYLOADS
// ═══════════════════════════════════════════════════════════════

/** Body sent to POST /auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Body sent to POST /auth/signup */
export interface RegisterRequest {
  email: string;
  fullName: string;
  phone: string;
  password: string;
}

/** Body sent to POST /auth/forgot-password */
export interface ForgotPasswordRequest {
  email: string;
}

/** Body sent to POST /auth/reset-password */
export interface ResetPasswordRequest {
  /** One-time token extracted from the reset link URL query param */
  token: string;
  /** The new password chosen by the user */
  newPassword: string;
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE SHAPES
// ═══════════════════════════════════════════════════════════════

/** Response from POST /auth/login — cookie is set server-side, not here */
export interface LoginResponse {
  user: AuthUser;
  message?: string;
}

/** Response from POST /auth/register */
export interface RegisterResponse {
  message: string;
}

/** Response from POST /auth/forgot-password */
export interface ForgotPasswordResponse {
  message: string;
}

/** Response from POST /auth/reset-password */
export interface ResetPasswordResponse {
  message: string;
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL AUTH STATE
// ═══════════════════════════════════════════════════════════════

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
