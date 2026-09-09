import { Company, ICompany } from "./company.model";

/**
 * There is exactly one settings document.
 *
 * Created on first read rather than seeded, so a fresh install and an upgraded
 * one behave the same and no screen has to handle "settings not set up yet" —
 * it either has the office's details or it has the defaults, never nothing.
 */
const getSettings = async () => {
  const existing = await Company.findOne();
  if (existing) return existing;
  return Company.create({ name: "Zoom Property" });
};

const updateSettings = async (payload: Partial<ICompany>, by?: string) => {
  const current = await getSettings();
  return Company.findByIdAndUpdate(
    current._id,
    { ...payload, updatedBy: by },
    { new: true, runValidators: true }
  );
};

export const CompanyService = { getSettings, updateSettings };
