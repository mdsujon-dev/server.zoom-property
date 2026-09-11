import mongoose from "mongoose";
import config from "../app/config";
import { PropertyType } from "../app/modules/property/property.model";

/**
 * 10 default Property Types with English & Bangla labels, icons, and descriptions.
 * Idempotent on `name` key.
 *
 * Command:
 *   npm run seed:types
 */
export const DEFAULT_PROPERTY_TYPES = [
  {
    name: "apartment",
    description: "Apartment / Flat",
    nameBn: "অ্যাপার্টমেন্ট / ফ্ল্যাট",
    icon: "building-2",
    order: 1,
    isActive: true,
  },
  {
    name: "duplex",
    description: "Duplex & Penthouse",
    nameBn: "ডুপ্লেক্স ও পেন্টহাউস",
    icon: "layers",
    order: 2,
    isActive: true,
  },
  {
    name: "house",
    description: "Independent House / Villa",
    nameBn: "স্বাধীন বাড়ি / ভিলা",
    icon: "home",
    order: 3,
    isActive: true,
  },
  {
    name: "commercial",
    description: "Commercial Space & Office",
    nameBn: "বাণিজ্যিক স্থান ও অফিস",
    icon: "building",
    order: 4,
    isActive: true,
  },
  {
    name: "land",
    description: "Plot & Land",
    nameBn: "প্লট ও জমি",
    icon: "map-pin",
    order: 5,
    isActive: true,
  },
  {
    name: "studio",
    description: "Studio Apartment",
    nameBn: "স্টুডিও অ্যাপার্টমেন্ট",
    icon: "layout",
    order: 6,
    isActive: true,
  },
  {
    name: "warehouse",
    description: "Warehouse & Industrial",
    nameBn: "ওয়্যারহাউস ও গোডাউন",
    icon: "warehouse",
    order: 7,
    isActive: true,
  },
  {
    name: "shop",
    description: "Retail Shop & Showroom",
    nameBn: "দোকান ও শোরুম",
    icon: "shopping-bag",
    order: 8,
    isActive: true,
  },
  {
    name: "sublet",
    description: "Room & Sublet",
    nameBn: "কক্ষ ও সাবলেট",
    icon: "bed",
    order: 9,
    isActive: true,
  },
  {
    name: "garage",
    description: "Parking & Garage",
    nameBn: "পার্কিং ও গ্যারেজ",
    icon: "car",
    order: 10,
    isActive: true,
  },
];

export const seedPropertyTypes = async () => {
  let createdCount = 0;
  for (const item of DEFAULT_PROPERTY_TYPES) {
    const existing = await PropertyType.findOne({ name: item.name });
    if (!existing) {
      await PropertyType.create(item);
      createdCount++;
    } else {
      // Update missing nameBn or description if existing record lacks them
      await PropertyType.updateOne(
        { name: item.name },
        {
          $set: {
            description: existing.description || item.description,
            nameBn: existing.nameBn || item.nameBn,
            icon: existing.icon || item.icon,
          },
        }
      );
    }
  }
  return createdCount;
};

const run = async () => {
  if (!config.db_url) throw new Error("DB_URL is not set.");
  await mongoose.connect(config.db_url);
  console.log(`🛢  Connected to DB: ${mongoose.connection.name}`);

  const created = await seedPropertyTypes();
  console.log(`✅ Seeded ${created} new property types (out of ${DEFAULT_PROPERTY_TYPES.length} total).`);
  await mongoose.disconnect();
};

if (require.main === module) {
  run().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
}
