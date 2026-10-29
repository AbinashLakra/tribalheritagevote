/**
 * @file Role-Based Access Control (RBAC) permission system.
 *
 * Defines all application roles, granular permissions, and helper functions
 * for authorization checks throughout the platform.
 */

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

/** All application roles. */
export const ROLES = {
  PUBLIC: 'public',
  VOTER: 'voter',
  ARTIST: 'artist',
  REVIEWER: 'reviewer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

/** Union type of all role string values. */
export type Role = (typeof ROLES)[keyof typeof ROLES];

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

/** All granular permissions within the application. */
export const PERMISSIONS = {
  // Public
  VIEW_PUBLIC_CONTENT: 'view_public_content',
  VIEW_APPROVED_ARTISTS: 'view_approved_artists',
  VIEW_PUBLIC_LEADERBOARD: 'view_public_leaderboard',

  // Voter
  CAST_VOTE: 'cast_vote',
  VIEW_OWN_VOTE: 'view_own_vote',

  // Artist
  MANAGE_OWN_PROFILE: 'manage_own_profile',
  SUBMIT_NOMINATION: 'submit_nomination',
  VIEW_OWN_NOMINATIONS: 'view_own_nominations',
  UPLOAD_MEDIA: 'upload_media',

  // Reviewer
  REVIEW_NOMINATIONS: 'review_nominations',
  APPROVE_NOMINATIONS: 'approve_nominations',
  REJECT_NOMINATIONS: 'reject_nominations',

  // Admin
  MANAGE_CONTESTS: 'manage_contests',
  MANAGE_VOTING: 'manage_voting',
  VIEW_ALL_USERS: 'view_all_users',
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  EXPORT_DATA: 'export_data',

  // Super Admin
  MANAGE_STAFF: 'manage_staff',
  MANAGE_ROLES: 'manage_roles',
  FINALIZE_RESULTS: 'finalize_results',
  PUBLISH_RESULTS: 'publish_results',
  SYSTEM_SETTINGS: 'system_settings',
} as const;

/** Union type of all permission string values. */
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ---------------------------------------------------------------------------
// Role → Permissions mapping (higher roles inherit lower role permissions)
// ---------------------------------------------------------------------------

/** Permissions granted exclusively to the public role (no authentication). */
const PUBLIC_PERMISSIONS: Permission[] = [
  PERMISSIONS.VIEW_PUBLIC_CONTENT,
  PERMISSIONS.VIEW_APPROVED_ARTISTS,
  PERMISSIONS.VIEW_PUBLIC_LEADERBOARD,
];

/** Permissions granted to authenticated voters (inherits public). */
const VOTER_PERMISSIONS: Permission[] = [
  ...PUBLIC_PERMISSIONS,
  PERMISSIONS.CAST_VOTE,
  PERMISSIONS.VIEW_OWN_VOTE,
];

/** Permissions granted to artist accounts (inherits voter). */
const ARTIST_PERMISSIONS: Permission[] = [
  ...VOTER_PERMISSIONS,
  PERMISSIONS.MANAGE_OWN_PROFILE,
  PERMISSIONS.SUBMIT_NOMINATION,
  PERMISSIONS.VIEW_OWN_NOMINATIONS,
  PERMISSIONS.UPLOAD_MEDIA,
];

/** Permissions granted to nomination reviewers (inherits artist). */
const REVIEWER_PERMISSIONS: Permission[] = [
  ...ARTIST_PERMISSIONS,
  PERMISSIONS.REVIEW_NOMINATIONS,
  PERMISSIONS.APPROVE_NOMINATIONS,
  PERMISSIONS.REJECT_NOMINATIONS,
];

/** Permissions granted to platform administrators (inherits reviewer). */
const ADMIN_PERMISSIONS: Permission[] = [
  ...REVIEWER_PERMISSIONS,
  PERMISSIONS.MANAGE_CONTESTS,
  PERMISSIONS.MANAGE_VOTING,
  PERMISSIONS.VIEW_ALL_USERS,
  PERMISSIONS.VIEW_ANALYTICS,
  PERMISSIONS.VIEW_AUDIT_LOGS,
  PERMISSIONS.EXPORT_DATA,
];

/** Permissions granted to super administrators (inherits admin — full access). */
const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  PERMISSIONS.MANAGE_STAFF,
  PERMISSIONS.MANAGE_ROLES,
  PERMISSIONS.FINALIZE_RESULTS,
  PERMISSIONS.PUBLISH_RESULTS,
  PERMISSIONS.SYSTEM_SETTINGS,
];

/**
 * Map from each {@link Role} to the complete set of {@link Permission}s it
 * grants. Higher-privilege roles include all permissions of lower roles.
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  [ROLES.PUBLIC]: PUBLIC_PERMISSIONS,
  [ROLES.VOTER]: VOTER_PERMISSIONS,
  [ROLES.ARTIST]: ARTIST_PERMISSIONS,
  [ROLES.REVIEWER]: REVIEWER_PERMISSIONS,
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
  [ROLES.SUPER_ADMIN]: SUPER_ADMIN_PERMISSIONS,
} as const;

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Checks whether a user with the given roles has the specified permission.
 *
 * A user may hold multiple roles; the permission is granted if **any** of
 * their roles includes it.
 *
 * @param userRoles - Array of roles assigned to the user.
 * @param permission - The permission to check.
 * @returns `true` if at least one of the user's roles grants the permission.
 */
export function hasPermission(
  userRoles: Role[],
  permission: Permission,
): boolean {
  return userRoles.some((role) => {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions?.includes(permission) ?? false;
  });
}

/**
 * Checks whether the user holds at least one of the required roles.
 *
 * @param userRoles - Array of roles assigned to the user.
 * @param requiredRoles - Array of roles to check against.
 * @returns `true` if the user has at least one of the required roles.
 */
export function hasAnyRole(userRoles: Role[], requiredRoles: Role[]): boolean {
  return userRoles.some((role) => requiredRoles.includes(role));
}

/**
 * Checks whether the user has the `admin` or `super_admin` role.
 *
 * @param userRoles - Array of roles assigned to the user.
 */
export function isAdmin(userRoles: Role[]): boolean {
  return hasAnyRole(userRoles, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
}

/**
 * Checks whether the user has the `super_admin` role.
 *
 * @param userRoles - Array of roles assigned to the user.
 */
export function isSuperAdmin(userRoles: Role[]): boolean {
  return userRoles.includes(ROLES.SUPER_ADMIN);
}

/**
 * Checks whether the user has the `reviewer` role (or higher).
 *
 * @param userRoles - Array of roles assigned to the user.
 */
export function isReviewer(userRoles: Role[]): boolean {
  return hasAnyRole(userRoles, [
    ROLES.REVIEWER,
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
  ]);
}

/**
 * Checks whether the user has the `artist` role (or higher).
 *
 * @param userRoles - Array of roles assigned to the user.
 */
export function isArtist(userRoles: Role[]): boolean {
  return hasAnyRole(userRoles, [
    ROLES.ARTIST,
    ROLES.REVIEWER,
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
  ]);
}
