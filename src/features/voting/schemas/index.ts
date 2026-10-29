import { z } from "zod";

/** Vote casting schema */
export const voteSchema = z.object({
  contestId: z.string().uuid("Invalid contest ID"),
  nominationId: z.string().uuid("Invalid nomination ID"),
});

export type VoteInput = z.infer<typeof voteSchema>;

