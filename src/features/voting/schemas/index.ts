import { z } from "zod";

const uuidLike = z.string().regex(/^[0-9a-fA-F-]{36}$/, "Invalid ID format");

/** Vote casting schema */
export const voteSchema = z.object({
  contestId: uuidLike,
  nominationId: uuidLike,
});

export type VoteInput = z.infer<typeof voteSchema>;

