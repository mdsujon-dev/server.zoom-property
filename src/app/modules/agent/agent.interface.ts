import { Types, Document } from "mongoose";

export interface IAgent extends Document {
  agentId: string;
  slug: string;
  name: string;
  nameBn?: string;
  role: string;
  roleBn?: string;
  phone: string;
  patch: string[];
  deals: number;
  rating: number;
  respondsIn: number;
  image?: Types.ObjectId;
  languages: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
