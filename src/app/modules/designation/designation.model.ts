import { Schema, model } from "mongoose";
import { DESIGNATION_SCOPES } from "../../access";
import { IDesignation } from "./designation.interface";

const designationSchema = new Schema<IDesignation>(
  {
    name: { type: String, required: true },
    description: { type: String },
    is_active: { type: Boolean, default: true },
    // Defaults to "employee" so every designation created before this field
    // existed keeps showing up where it always did.
    scope: {
      type: String,
      enum: DESIGNATION_SCOPES,
      default: "employee",
      index: true,
    },
  },
  { timestamps: true }
);

export const Designation = model<IDesignation>(
  "Designation",
  designationSchema
);
