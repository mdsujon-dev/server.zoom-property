import { z } from "zod";
// inquiries.validation.ts

// Contact Form Validation
export const createContactMessage = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string({ required_error: "Phone is required" }),
    subject: z.string().optional(),
    message: z.string({ required_error: "Message is required" }),
    type: z.string().optional(),
    enquiry: z.string().optional(),
    area: z.string().optional(),
    budget: z.string().optional(),
    source: z.string().optional(),
  }),
});

// Quotation Form Validation
export const createQuotationRequest = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().optional(),
    site_url: z.string().optional(),
    company_name: z.string().optional(),
    service: z.string().min(1, "Service is required"),
    budget: z.string().min(1, "Budget is required"),
    message: z.string().min(1, "Message is required"),
  }),
});

/*
 * The reply the office types back to an enquirer.
 *
 * Unchecked until now, and this one leaves the building: an empty subject was
 * sent as an empty subject, and a missing body reached the mail client as
 * `undefined`. What goes out over the institute's name is worth a look first.
 */
export const sendEmail = z.object({
  body: z.object({
    subject: z.string().min(1, "A subject is required"),
    body: z.string().min(1, "Write something to send"),
  }),
});

export const inquiriesValidation = {
  createContactMessage,
  createQuotationRequest,
  sendEmail,
};
