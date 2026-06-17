/**
 * authApi.ts
 * ─────────────────────────────────────────────────────────────
 * Re-exports all auth API functions from axiosClient for backward
 * compatibility with existing imports (e.g. authApi.getMe()).
 * ─────────────────────────────────────────────────────────────
 */

export {
  loginRequest        as login,
  registerRequest     as register,
  getMeRequest        as getMe,
  logoutRequest       as logout,
  forgotPasswordRequest  as forgotPassword,
  resetPasswordRequest   as resetPassword,
} from './axiosClient';

// Re-export types so existing code that imports from authApi still works
export type {
  LoginRequest        as LoginCredentials,
  RegisterRequest     as RegisterPayload,
  LoginResponse,
  RegisterResponse,
  AuthUser,
} from '../types/auth.types';
