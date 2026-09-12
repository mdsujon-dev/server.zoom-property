import { Schema, model } from "mongoose";
import { IAgent } from "./agent.interface";

const agentSchema = new Schema<IAgent>(
  {
    name: { type: String, required: true, trim: true },
    nameBn: { type: String, trim: true },
    role: { type: String, required: true, trim: true },
    roleBn: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    patch: [{ type: String, trim: true }],
    deals: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    respondsIn: { type: Number, default: 15 },
    image: { type: Schema.Types.ObjectId, ref: "Media" },
    languages: [{ type: String, trim: true }],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Filters out deleted agents automatically in queries
agentSchema.pre(/^find/, function (next) {
  (this as any).find({ isDeleted: { $ne: true } });
  next();
});

export const Agent = model<IAgent>("Agent", agentSchema);
