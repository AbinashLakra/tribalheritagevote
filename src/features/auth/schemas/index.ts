import { z } from "zod";

/** Phone number schema for Indian mobile numbers (10 digits with optional +91 or 91 prefix) */
export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number is too long")
  .regex(
    /^(?:\+91|91)?[6-9]\d{9}$/,
    "Please enter a valid Indian mobile number (e.g. +919876543210 or 9876543210)"
  );

/** OTP verification schema */
export const otpSchema = z.object({
  phone: phoneSchema,
  token: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

/** Phone input schema for requesting OTP */
export const phoneInputSchema = z.object({
  phone: phoneSchema,
  countryCode: z.string().default("+91"),
});

/** Email schema for free voter verification */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address (e.g. name@gmail.com)")
  .max(254, "Email address is too long");

export type PhoneInput = z.infer<typeof phoneInputSchema>;
export type OtpInput = z.infer<typeof otpSchema>;

