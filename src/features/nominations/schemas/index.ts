import { z } from 'zod';

/** Nomination submission schema */
export const nominationSchema = z.object({
  // Artist Personal Information
  fullName: z.string().min(2, 'Official / Full name is required').max(150),
  stageName: z.string().min(2, 'Stage / Troupe name is required').max(150),
  phone: z
    .string()
    .min(10, 'Mobile number must be 10 digits')
    .max(10, 'Mobile number must be 10 digits')
    .regex(/^\d{10}$/, 'Must be a valid 10-digit Indian mobile number'),
  state: z.string().min(2, 'State is required'),
  district: z.string().min(2, 'District is required'),
  language: z.string().min(2, 'Language / Dialect is required'),
  tribe: z.string().min(2, 'Tribe / Community is required'),
  experienceYears: z.coerce.number().min(0).max(80).default(3),
  bio: z.string().min(10, 'Brief artist bio must be at least 10 characters').max(2000),

  // Contest & Performance Details
  contestId: z.string().regex(/^[0-9a-fA-F-]{36}$/, 'Invalid contest ID format'),
  categoryId: z.string().regex(/^[0-9a-fA-F-]{36}$/, 'Invalid category ID format'),
  title: z
    .string()
    .min(5, 'Performance title must be at least 5 characters')
    .max(200, 'Performance title must not exceed 200 characters'),
  description: z
    .string()
    .min(20, 'Performance description must be at least 20 characters')
    .max(3000, 'Performance description must not exceed 3000 characters'),
});

/** Nomination review schema (for reviewers/admins) */
export const nominationReviewSchema = z.object({
  nominationId: z.string().regex(/^[0-9a-fA-F-]{36}$/, 'Invalid nomination ID format'),
  action: z.enum(['approve', 'reject', 'request_correction', 'unapprove']),
  reviewerNotes: z.string().max(1000).optional().or(z.literal('')).nullable(),
  rejectionReason: z.string().max(1000).optional().or(z.literal('')).nullable(),
});

export type NominationInput = z.infer<typeof nominationSchema>;
export type NominationReviewInput = z.infer<typeof nominationReviewSchema>;
