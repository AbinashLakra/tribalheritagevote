import { z } from "zod";

/** Nomination submission schema */
export const nominationSchema = z.object({
  contestId: z.string().uuid("Invalid contest ID"),
  categoryId: z.string().uuid("Invalid category ID"),
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must not exceed 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(3000, "Description must not exceed 3000 characters"),
});

/** Nomination review schema (for reviewers/admins) */
export const nominationReviewSchema = z.object({
  nominationId: z.string().uuid("Invalid nomination ID"),
  action: z.enum(["approve", "reject", "request_correction"]),
  reviewerNotes: z.string().max(1000).optional(),
  rejectionReason: z
    .string()
    .min(10, "Please provide a reason for rejection")
    .max(1000)
    .optional(),
});

export type NominationInput = z.infer<typeof nominationSchema>;
export type NominationReviewInput = z.infer<typeof nominationReviewSchema>;

