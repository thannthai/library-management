/**
 * axiosClient.ts
 * ─────────────────────────────────────────────────────────────
 * Shared Axios instance for all BookNest API requests.
 *
 * Security contract:
 *   - JWT lives in an HttpOnly Cookie named "accessToken" set by the backend.
 *   - Frontend never reads, writes, or stores the token manually.
 *   - `withCredentials: true` makes the browser attach the cookie automatically
 *     on every cross-origin request.
 * ─────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  AuthUser,
} from '../types/auth.types';

// ─── Axios Instance ───────────────────────────────────────────────────────────

const axiosClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true,           // Required — attaches HttpOnly Cookie on all requests
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Response interceptor.
 * Normalises every error so callers can always `catch (err)` and read
 * `err.message` without unpacking Axios internals.
 */
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage: string | undefined =
      // Spring Boot typically sends { message: "..." } or { error: "..." }
      error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.message;

    return Promise.reject(new Error(serverMessage ?? 'Đã xảy ra lỗi không xác định.'));
  },
);

// ─── Spring Boot ApiResponse Wrapper & Mapper ───────────────────────────────────

interface ApiResponse<T> {
  message: string;
  status: boolean;
  data: T;
}

/**
 * Maps the backend UserResponse structure to the frontend AuthUser model,
 * resolving field differences (like role vs roles array).
 */
const mapToAuthUser = (userRes: any): AuthUser => {
  if (!userRes) {
    throw new Error('Dữ liệu phản hồi từ máy chủ không hợp lệ.');
  }

  // Get the first role from roles list (e.g., ["ROLE_USER"])
  const rawRole = Array.isArray(userRes.roles) && userRes.roles.length > 0
    ? userRes.roles[0]
    : 'ROLE_USER';

  // Normalize role string (e.g., ROLE_USER -> MEMBER, ROLE_ADMIN -> ADMIN)
  let role = rawRole.replace('ROLE_', '');
  if (role === 'USER') {
    role = 'MEMBER';
  }

  return {
    id: userRes.id,
    email: userRes.email,
    fullName: userRes.fullName,
    phone: userRes.phone,
    roles: userRes.roles || [],
    role: role,
    username: userRes.email, // Use email as fallback username
    isVerified: userRes.verified ?? userRes.isVerified ?? false,
  };
};

// ─── Auth API Helper Functions ────────────────────────────────────────────────

/**
 * POST /auth/login
 * Submits credentials. On success, the backend sets the "accessToken"
 * HttpOnly Cookie. The frontend only needs to store the returned user object.
 */
export const loginRequest = async (payload: LoginRequest): Promise<LoginResponse> => {
  const { data } = await axiosClient.post<ApiResponse<any>>('/auth/login', payload);
  return {
    user: mapToAuthUser(data.data),
    message: data.message,
  };
};

/**
 * POST /auth/signup
 * Creates a new member account.
 */
export const registerRequest = async (payload: RegisterRequest): Promise<RegisterResponse> => {
  const { data } = await axiosClient.post<ApiResponse<any>>('/auth/signup', payload);
  return {
    message: data.message,
  };
};

/**
 * GET /users/me
 * Uses the current HttpOnly Cookie to identify the caller.
 * Returns 200 + user info if the cookie is valid, 401 if expired/absent.
 */
export const getMeRequest = async (): Promise<AuthUser> => {
  const { data } = await axiosClient.get<ApiResponse<any>>('/users/me');
  return mapToAuthUser(data.data);
};

/**
 * POST /auth/logout
 * Instructs the backend to invalidate the cookie (clear server-side session
 * or blacklist the JWT). The browser also clears the HttpOnly Cookie.
 */
export const logoutRequest = async (): Promise<void> => {
  // Try sending a request to the backend. If it has no logout endpoint, this will catch the 404/403.
  try {
    await axiosClient.post('/auth/logout');
  } catch (err) {
    console.warn('Backend does not support /auth/logout or returned an error:', err);
  }
};

/**
 * POST /auth/forgot-password
 * Triggers the backend to send a password-reset email to the given address.
 */
export const forgotPasswordRequest = async (
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> => {
  const { data } = await axiosClient.post<ApiResponse<any>>('/auth/forgot-password', payload);
  return {
    message: data.message,
  };
};

/**
 * POST /auth/reset-password
 * Submits the one-time reset token (extracted from the URL) together with
 * the user's new password.
 */
export const resetPasswordRequest = async (
  payload: ResetPasswordRequest,
): Promise<ResetPasswordResponse> => {
  const { data } = await axiosClient.post<ApiResponse<any>>('/auth/reset-password', payload);
  return {
    message: data.message,
  };
};

export default axiosClient;
