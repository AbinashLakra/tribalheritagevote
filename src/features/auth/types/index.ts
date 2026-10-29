/** Authentication state and session types */

export interface AuthUser {
  id: string;
  phone: string | null;
  email: string | null;
  isVerified: boolean;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface OtpRequestResult {
  success: boolean;
  message: string;
  /** Cooldown in seconds before next OTP request is allowed */
  cooldownSeconds?: number;
}

export interface OtpVerifyResult {
  success: boolean;
  message: string;
  user?: AuthUser;
}

export type AuthState =
  | { status: "unauthenticated" }
  | { status: "verifying"; phone: string }
  | { status: "authenticated"; user: AuthUser };

