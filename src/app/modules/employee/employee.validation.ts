import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const weekday = z.enum(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]);

/**
 * The structured address, which lives on the account.
 *
 * Written once and spread into both schemas: fourteen fields listed twice is
 * fourteen chances for the two to disagree about which are optional.
 */
const addressFields = {
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
};

export const employeeValidation = {
  create: z.object({
    body: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters long"),
      username: z.string().optional(),
      phone: z.string().optional(),
      profilePhoto: z.string().optional(),
      roleId: z.string().regex(objectIdRegex, "Invalid role ID format"),
      designationId: z
        .string()
        .regex(objectIdRegex, "Invalid designation ID format")
        .optional(),
      ...addressFields,
      weekendDays: z.array(weekday).optional(),
      note: z.string().optional(),
    }),
  }),
  update: z
    .object({
      body: z
        .object({
          name: z.string().min(1, "Name is required").optional(),
          email: z.string().email("Invalid email address").optional(),
          username: z.string().optional(),
          phone: z.string().optional(),
          profilePhoto: z.string().optional(),
          roleId: z
            .string()
            .regex(objectIdRegex, "Invalid role ID format")
            .optional(),
          designationId: z
            .string()
            .regex(objectIdRegex, "Invalid designation ID format")
            .optional(),
          isActive: z.boolean().optional(),
          ...addressFields,
          weekendDays: z.array(weekday).optional(),
          note: z.string().optional(),
        })
        .strict(),
    }),
  /**
   * The HR file. Previously unvalidated: the route handed the whole body to
   * `findOneAndUpdate`, and only mongoose's own schema decided what survived.
   * That is a thin defence — a mistyped `salary: "12,000"` reached the database
   * layer to be refused there, with an error nobody at a desk could read.
   */
  profile: z.object({
    body: z
      .object({
        dateOfBirth: z.string().optional(),
        gender: z.enum(["Male", "Female", "Other"]).optional(),
        bloodGroup: z.string().optional(),
        fatherName: z.string().optional(),
        motherName: z.string().optional(),
        maritalStatus: z
          .enum(["single", "married", "divorced", "widowed"])
          .optional(),

        employmentType: z.enum(["full-time", "part-time", "contract"]).optional(),
        joiningDate: z.string().optional(),
        resignDate: z.string().optional(),
        salary: z.number().min(0, "Salary cannot be negative").optional(),
        salaryType: z.enum(["monthly", "daily", "yearly"]).optional(),

        nidNumber: z.string().optional(),
        emergencyContactName: z.string().optional(),
        emergencyContactPhone: z.string().optional(),
        documents: z.array(z.string().regex(objectIdRegex)).optional(),

        status: z.enum(["active", "inactive", "resigned"]).optional(),
        note: z.string().optional(),
      })
      .strict(),
  }),
  changePassword: z.object({
    body: z.object({
      newPassword: z
        .string()
        .min(6, "Password must be at least 6 characters long"),
    }),
  }),
};
