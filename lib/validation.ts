import { z } from "zod";
import { LOCALE_CODES } from "@/lib/i18n/locales";
import { isWebAddress } from "@/lib/url";

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => value ?? "");

export const urlRowSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(2048)
    .url("Enter a valid URL")
    .refine((url) => !/\s/.test(url), "URL must not contain spaces")
    .refine(isWebAddress, "Use a http(s) address with a full domain, e.g. example.com"),
  note: optionalTrimmed(280),
});

// ISO-639-3 codes. The id is also used as a file name, so it must stay
// this strict.
export const languageIdSchema = z.string().trim().regex(/^[a-z]{3}$/, "Choose a language");

export const submissionPayloadSchema = z.object({
  languageId: languageIdSchema,
  links: z.array(urlRowSchema).min(1, "Add at least one link").max(20),
  // The interface language the visitor was using, so reviewers know what
  // language a note is probably written in.
  uiLocale: z.enum(LOCALE_CODES),
});
