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

export const ROLE_PRESETS = {
  all_access: {
    key: 'all_access',
    label: 'All Platform Delegated Access',
    badge: 'All Access',
    description: 'Full operational access across Video Moderation, Contest Timeline, Audit Ledger, CSV Data Export, and Analytics.',
    permissions: {
      can_moderate_videos: true,
      can_manage_contest: true,
      can_view_audit_logs: true,
      can_export_data: true,
      can_view_analytics: true,
      can_manage_admins: false,
    },
  },
  video_reviewer: {
    key: 'video_reviewer',
    label: 'Video Performance Reviewer (Jury)',
    badge: 'Video Jury',
    description: 'Review and approve/reject artist video audition submissions and view analytics.',
    permissions: {
      can_moderate_videos: true,
      can_manage_contest: false,
      can_view_audit_logs: false,
      can_export_data: false,
      can_view_analytics: true,
      can_manage_admins: false,
    },
  },
  contest_coordinator: {
    key: 'contest_coordinator',
    label: 'Contest Lifecycle Coordinator',
    badge: 'Contest Lead',
    description: 'Manage contest timeline, extension dates, status triggers, and nominations.',
    permissions: {
      can_moderate_videos: true,
      can_manage_contest: true,
      can_view_audit_logs: false,
      can_export_data: false,
      can_view_analytics: true,
      can_manage_admins: false,
    },
  },
  auditor: {
    key: 'auditor',
    label: 'Voting Integrity & Audit Inspector',
    badge: 'Security Auditor',
    description: 'Inspect cryptographic vote ledgers, IP fraud checks, and download audit reports.',
    permissions: {
      can_moderate_videos: false,
      can_manage_contest: false,
      can_view_audit_logs: true,
      can_export_data: true,
      can_view_analytics: true,
      can_manage_admins: false,
    },
  },
  data_analyst: {
    key: 'data_analyst',
    label: 'Results & Analytics Officer',
    badge: 'Data Analyst',
    description: 'Monitor real-time voter turnout, leaderboard metrics, and export voting tally reports.',
    permissions: {
      can_moderate_videos: false,
      can_manage_contest: false,
      can_view_audit_logs: false,
      can_export_data: true,
      can_view_analytics: true,
      can_manage_admins: false,
    },
  },
} as const;

export type RoleCategoryKey = keyof typeof ROLE_PRESETS;
