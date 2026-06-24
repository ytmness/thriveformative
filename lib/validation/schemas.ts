import { z } from "zod";

const emailField = z.string().trim().email().max(254);
const shortText = z.string().trim().min(1).max(200);
const messageText = z.string().trim().min(1).max(5000);

const honeypotShape = {
  website: z.string().max(200).optional(),
};

export const appointmentPendingSchema = z
  .object({
    kind: z.literal("appointment_pending"),
    date: z.string().trim().min(1).max(32),
    timeSlot: z.string().trim().min(1).max(16),
    ...honeypotShape,
  })
  .strict();

export const appointmentAdminEmailSchema = z
  .object({
    kind: z.enum(["appointment_confirmed", "appointment_cancelled"]),
    appointmentId: z.string().uuid(),
    date: z.string().trim().min(1).max(32),
    timeSlot: z.string().trim().min(1).max(16),
    ...honeypotShape,
  })
  .strict();

export const contactConfirmationSchema = z
  .object({
    kind: z.literal("contact_confirmation"),
    email: emailField,
    name: shortText,
    ...honeypotShape,
  })
  .strict();

export const contactNotifyAdminSchema = z
  .object({
    kind: z.literal("contact_notify_admin"),
    name: shortText,
    email: emailField,
    subject: z.string().trim().max(200).nullable().optional(),
    message: messageText,
    ...honeypotShape,
  })
  .strict();

export const sendEmailBodySchema = z.discriminatedUnion("kind", [
  appointmentPendingSchema,
  appointmentAdminEmailSchema,
  contactConfirmationSchema,
  contactNotifyAdminSchema,
]);

export const comingSoonUnlockSchema = z.object({
  password: z.string().min(1).max(256),
});

export type SendEmailBody = z.infer<typeof sendEmailBodySchema>;
