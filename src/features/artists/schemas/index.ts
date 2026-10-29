import { z } from "zod";

/** Artist profile creation/update schema */
export const artistProfileSchema = z.object({
  stageName: z
    .string()
    .min(2, "Stage name must be at least 2 characters")
    .max(150, "Stage name is too long"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(150, "Full name is too long"),
  bio: z
    .string()
    .min(50, "Biography must be at least 50 characters")
    .max(2000, "Biography must not exceed 2000 characters"),
  state: z.string().min(1, "Please select your state"),
  district: z.string().min(1, "Please select your district"),
  language: z.string().min(1, "Please specify your preferred language"),
  primaryCategory: z.string().min(1, "Please select an art category"),
  experienceYears: z
    .number()
    .int()
    .min(0, "Experience years cannot be negative")
    .max(100, "Please enter a valid number of years"),
  socialLinks: z
    .object({
      website: z.string().url("Invalid URL").optional().or(z.literal("")),
      youtube: z.string().url("Invalid URL").optional().or(z.literal("")),
      instagram: z.string().url("Invalid URL").optional().or(z.literal("")),
      facebook: z.string().url("Invalid URL").optional().or(z.literal("")),
    })
    .optional(),
  consentDeclaration: z.literal(true, {
    message: "You must agree to the declaration to proceed",
  }),
});

export type ArtistProfileInput = z.infer<typeof artistProfileSchema>;

