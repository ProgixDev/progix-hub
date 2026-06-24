import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

/** Validate dossier input. Messages are i18n keys resolved by the action. */
export const dossierInputSchema = z
  .object({
    contact_name: optionalText,
    contact_email: optionalText,
    contact_phone: optionalText,
    company: optionalText,
    client_role: optionalText,
    client_type: optionalText,
    temperament: optionalText,
    notes: optionalText,
    it_savviness: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
      z
        .number()
        .int("dossier.errorSavviness")
        .min(1, "dossier.errorSavviness")
        .max(5, "dossier.errorSavviness")
        .nullable(),
    ),
  })
  .superRefine((val, ctx) => {
    if (val.contact_email && !z.string().email().safeParse(val.contact_email).success) {
      ctx.addIssue({ code: "custom", path: ["contact_email"], message: "dossier.errorEmail" });
    }
  });

export type DossierInput = z.infer<typeof dossierInputSchema>;
