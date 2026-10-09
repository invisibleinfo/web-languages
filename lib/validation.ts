import { z } from "zod";

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => value ?? "");

const urlRowSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(2048)
    .url("Enter a valid URL")
    .refine((value) => /^https?:\/\//i.test(value), "Use a http:// or https:// address"),
  note: optionalTrimmed(280),
});

export const submissionPayloadSchema = z.object({
  languageId: z.string().trim().min(1, "Choose a language"),
  links: z.array(urlRowSchema).min(1, "Add at least one link").max(20),
  sessionId: z.string().trim().min(1).max(64),
  // Deliberately unrestricted: a bot filling this field with arbitrary text
  // must still pass shape validation so the route's honeypot check (not
  // this schema) is what decides the request is spam.
  honeypot: optionalTrimmed(500),
});
