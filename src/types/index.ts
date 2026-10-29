/**
 * @file Common shared types used across the Tribal Heritage Vote application.
 */

/**
 * Standard API response envelope.
 *
 * @typeParam T - The shape of the `data` payload on success
 */
export interface ApiResponse<T = unknown> {
  /** Whether the request completed successfully */
  success: boolean;
  /** Payload returned on success */
  data?: T;
  /** Machine-readable error code or short key */
  error?: string;
  /** Human-readable status or error message */
  message?: string;
}

/**
 * Paginated API response envelope.
 *
 * @typeParam T - The shape of each item in the `data` array
 */
export interface PaginatedResponse<T = unknown> {
  /** Array of items for the current page */
  data: T[];
  /** Total number of matching records */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/** Sort direction for ordered queries. */
export type SortDirection = 'asc' | 'desc';

/**
 * Common filter / pagination parameters accepted by list endpoints.
 * All fields are optional so callers can provide only what they need.
 */
export interface FilterParams {
  /** Free-text search query */
  search?: string;
  /** Filter by Indian state name */
  state?: string;
  /** Filter by district name */
  district?: string;
  /** Filter by art category slug or id */
  category?: string;
  /** Filter by status value (contest / nomination) */
  status?: string;
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Field name to sort by */
  sortBy?: string;
  /** Sort direction */
  sortDirection?: SortDirection;
}
