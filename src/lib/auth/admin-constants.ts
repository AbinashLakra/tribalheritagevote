export const ADMIN_COOKIE_NAME = 'admin_session_token';
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes (900 seconds)

export interface AdminPermissions {
  can_moderate_videos: boolean;
  can_manage_contest: boolean;
  can_view_audit_logs: boolean;
  can_export_data: boolean;
  can_view_analytics: boolean;
  can_manage_admins: boolean;
}

export interface AdminSessionPayload {
  role: 'super_admin' | 'sub_admin';
  adminId: string;
  username: string;
  name: string;
  phone?: string;
  email?: string;
  permissions: AdminPermissions;
  loginAt: number;
  lastActive: number;
}

export const SUPER_ADMIN_PERMISSIONS: AdminPermissions = {
  can_moderate_videos: true,
  can_manage_contest: true,
  can_view_audit_logs: true,
  can_export_data: true,
  can_view_analytics: true,
  can_manage_admins: true,
};

