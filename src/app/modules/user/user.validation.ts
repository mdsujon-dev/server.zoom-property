import { z } from "zod";
import { UserRole } from "../auth/auth.interface";

const loginInfoSchema = z.object({
  device: z.string().optional().default("pc"),
  browser: z.string().min(1, "Browser name is required"),
  ipAddress: z.string().min(1, "IP address is required"),
  pcName: z.string().optional(), // Optional field
  os: z.string().optional(), // Optional field
  userAgent: z.string().min(1, "User agent is required"),
});

const userValidationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    name: z.string().min(1, "Name is required"),
    role: z
      .enum([
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
        UserRole.ACCOUNTANT,
        UserRole.FRONT_DESK,
        UserRole.USER,
      ])
      .default(UserRole.SUPER_ADMIN)
      .optional(), // Match enum values in your code
    roleId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid role ID format")
      .optional(),
    designationId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid designation ID format")
      .optional(),
    loginInfo: loginInfoSchema, // Nested schema for lead info
  }),
});

const customerInfoValidationSchema = z.object({
  body: z
    .object({
      phoneNo: z
        .string()
        .regex(/^\d{11}$/, "Phone number must be exactly 11 digits long")
        .optional(),
      gender: z.enum(["Male", "Female", "Other"]).default("Other").optional(),
      dateOfBirth: z
        .string()
        .optional()
        .refine((value) => !value || !isNaN(Date.parse(value)), {
          message: "Invalid date format. Must be a valid date.",
        })
        .optional(),
      address: z.string().optional(),
      photo: z
        .string()
        .regex(
          /^(http(s)?:\/\/.*\.(?:png|jpg|jpeg))$/,
          "Invalid photo URL format. Must be a valid image URL."
        )
        .optional(),
    })
    .strict(),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().optional(),
    role: z
      .enum([
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
        UserRole.ACCOUNTANT,
        UserRole.FRONT_DESK,
        UserRole.USER,
      ])
      .default(UserRole.SUPER_ADMIN)
      .optional(),
    roleId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid role ID format").optional(),
    designationId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid designation ID format").optional(),
    profilePhoto: z.string().optional(),
    isActive: z.boolean().optional(),
    // What the agency agreed to pay them. The schema is strict, so without
    // these two the profile's Pay dialog would be refused rather than saved.
  presentDivision: z.string().optional(),
  presentDistrict: z.string().optional(),
  presentCity: z.string().optional(),
  presentPoliceStation: z.string().optional(),
  presentPostOffice: z.string().optional(),
  presentPostalCode: z.string().optional(),
  presentDetailedAddress: z.string().optional(),

  permanentDivision: z.string().optional(),
  permanentDistrict: z.string().optional(),
  permanentCity: z.string().optional(),
  permanentPoliceStation: z.string().optional(),
  permanentPostOffice: z.string().optional(),
  permanentPostalCode: z.string().optional(),
  permanentDetailedAddress: z.string().optional(),

    salary: z.number().min(0).optional().nullable(),
    salaryType: z.enum(["monthly", "per-class", "per-hour"]).optional(),
    /* Their own weekly days off. An empty list means the company's week —
       which is why it is allowed rather than rejected as pointless. */
    weekendDays: z
      .array(z.enum(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]))
      .optional(),
    note: z.string().optional(),
  }).strict(),
});

const changePasswordValidationSchema = z.object({
  body: z.object({
    newPassword: z.string().min(6, "Password must be at least 6 characters long"),
    oldPassword: z.string().optional(), // Optional for admin password change
  }),
});

export const UserValidation = {
  // Paying an employee, and taking an overpayment back. Same shape either way
  // — the route decides which side of the ledger it lands on. Mirrors the
  // trainer's, because it is the same payment.
  salary: z.object({
    body: z.object({
      amount: z.number().positive("Enter an amount above zero"),
      // Which expense head to file it under. Optional: left out, it goes to the
      // salary head, which is what it is nine times in ten.
      head: z.string().optional(),
      // "YYYY-MM": the month the pay is for. Defaults to the current month.
      salaryMonth: z
        .string()
        .regex(/^\d{4}-\d{2}$/, "Month must look like 2026-08")
        .optional(),
      method: z
        .enum(["cash", "bkash", "nagad", "rocket", "bank", "card", "other"])
        .optional(),
      date: z.string().optional(),
      reference: z.string().optional(),
      note: z.string().optional(),
    }),
  }),
  userValidationSchema,
  customerInfoValidationSchema,
  updateUserValidationSchema,
  changePasswordValidationSchema,
};
