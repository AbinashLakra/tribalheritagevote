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
  role: 'super_admin' | 'co_admin' | 'panel_admin' | 'sub_admin';
  adminId: string;
  username: string;
  name: string;
  phone?: string;
  email?: string;
  assignedPanel?: 1 | 2 | 3 | 4 | null;
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

export const CO_ADMIN_PERMISSIONS: AdminPermissions = {
  can_moderate_videos: true,
  can_manage_contest: true,
  can_view_audit_logs: true,
  can_export_data: true,
  can_view_analytics: true,
  can_manage_admins: true, // Second Main Admin can approve, shift, and manage the 4 Sub-Admins
};

export const PANEL_ADMIN_PERMISSIONS: AdminPermissions = {
  can_moderate_videos: true,
  can_manage_contest: false,
  can_view_audit_logs: false,
  can_export_data: false,
  can_view_analytics: true,
  can_manage_admins: false,
};

export const ROLE_PRESETS = {
  main_admin: {
    key: 'main_admin',
    label: 'Main Admin (Second Main Admin - All Access)',
    badge: 'Second Main Admin',
    role_type: 'co_admin' as const,
    assigned_panel: null as null | 1 | 2 | 3 | 4,
    description: 'Full operational access. Can approve & shift the 4 Sub-Admins, delete/unapprove nominations, modify voting dates, and manage all 8 categories.',
    permissions: {
      can_moderate_videos: true,
      can_manage_contest: true,
      can_view_audit_logs: true,
      can_export_data: true,
      can_view_analytics: true,
      can_manage_admins: true,
    },
  },
  panel_admin_1: {
    key: 'panel_admin_1',
    label: 'Admin 1: Panel 1 (Music Video & Lead Dance)',
    badge: 'Admin 1 (Panel 1)',
    role_type: 'panel_admin' as const,
    assigned_panel: 1 as const,
    description: 'Reviews, approves & moderates videos for Best Music Video (Nagpuri) & Best Dance in Video (Categories 1 & 2).',
    permissions: {
      can_moderate_videos: true,
      can_manage_contest: false,
      can_view_audit_logs: false,
      can_export_data: false,
      can_view_analytics: true,
      can_manage_admins: false,
    },
  },
  panel_admin_2: {
    key: 'panel_admin_2',
    label: 'Admin 2: Panel 2 (Leading Actor & Lead Singer)',
    badge: 'Admin 2 (Panel 2)',
    role_type: 'panel_admin' as const,
    assigned_panel: 2 as const,
    description: 'Reviews, approves & moderates videos for Best Actor in a Leading Role & Best Singer (Categories 3 & 4).',
    permissions: {
      can_moderate_videos: true,
      can_manage_contest: false,
      can_view_audit_logs: false,
      can_export_data: false,
      can_view_analytics: true,
      can_manage_admins: false,
    },
  },
  panel_admin_3: {
    key: 'panel_admin_3',
    label: 'Admin 3: Panel 3 (Cinematographer & Director)',
    badge: 'Admin 3 (Panel 3)',
    role_type: 'panel_admin' as const,
    assigned_panel: 3 as const,
    description: 'Reviews, approves & moderates videos for Best Cinematographer / Camera Person & Best Director (Categories 5 & 6).',
    permissions: {
      can_moderate_videos: true,
      can_manage_contest: false,
      can_view_audit_logs: false,
      can_export_data: false,
      can_view_analytics: true,
      can_manage_admins: false,
    },
  },
  panel_admin_4: {
    key: 'panel_admin_4',
    label: 'Admin 4: Panel 4 (Choreographer & Music Director)',
    badge: 'Admin 4 (Panel 4)',
    role_type: 'panel_admin' as const,
    assigned_panel: 4 as const,
    description: 'Reviews, approves & moderates videos for Best Choreographer & Best Music Director (Categories 7 & 8).',
    permissions: {
      can_moderate_videos: true,
      can_manage_contest: false,
      can_view_audit_logs: false,
      can_export_data: false,
      can_view_analytics: true,
      can_manage_admins: false,
    },
  },
  all_access: {
    key: 'all_access',
    label: 'All Platform Delegated Access (All Categories)',
    badge: 'All Access',
    role_type: 'co_admin' as const,
    assigned_panel: null as null | 1 | 2 | 3 | 4,
    description: 'Full operational access across Video Moderation, Contest Timeline, Audit Ledger, CSV Data Export, and Analytics.',
    permissions: {
      can_moderate_videos: true,
      can_manage_contest: true,
      can_view_audit_logs: true,
      can_export_data: true,
      can_view_analytics: true,
      can_manage_admins: true,
    },
  },
  video_reviewer: {
    key: 'video_reviewer',
    label: 'Video Performance Reviewer (Jury)',
    badge: 'Video Jury',
    role_type: 'panel_admin' as const,
    assigned_panel: 1 as const,
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
    role_type: 'co_admin' as const,
    assigned_panel: null as null | 1 | 2 | 3 | 4,
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
    role_type: 'co_admin' as const,
    assigned_panel: null as null | 1 | 2 | 3 | 4,
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
    role_type: 'co_admin' as const,
    assigned_panel: null as null | 1 | 2 | 3 | 4,
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
