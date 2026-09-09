import mongoose from "mongoose";

import config from "../app/config";
import { Property, PropertyAmenity } from "../app/modules/property/property.model";

/**
 * The twenty amenities a Dhaka listing is actually asked about.
 *
 * `icon` is a lucide name rather than an uploaded file, so the website can
 * draw it without a lookup table and a new amenity needs no artwork.
 *
 * The list is ordered the way a buyer asks: the things that decide whether a
 * flat is liveable first (lift, generator, parking, security), the comforts
 * after.
 *
 * Idempotent on name, so running it twice will not duplicate the list.
 *
 *   npm run seed:amenities
 */
const AMENITIES = [
  { name: "Lift", nameBn: "লিফট", icon: "arrow-up-down", description: "Passenger lift with backup power." },
  { name: "Standby generator", nameBn: "স্ট্যান্ডবাই জেনারেটর", icon: "zap", description: "Full-load backup during load shedding." },
  { name: "Reserved parking", nameBn: "সংরক্ষিত পার্কিং", icon: "car", description: "Allocated parking inside the boundary." },
  { name: "24/7 security", nameBn: "২৪/৭ নিরাপত্তা", icon: "shield-check", description: "Manned gate around the clock." },
  { name: "CCTV surveillance", nameBn: "সিসিটিভি নজরদারি", icon: "cctv", description: "Recorded coverage of entrances and lobbies." },
  { name: "Intercom", nameBn: "ইন্টারকম", icon: "phone-call", description: "Gate to apartment intercom." },
  { name: "Fire safety system", nameBn: "অগ্নি নিরাপত্তা ব্যবস্থা", icon: "flame", description: "Detectors, hose reels and a marked escape route." },
  { name: "Water reservoir and pump", nameBn: "পানির রিজার্ভার ও পাম্প", icon: "droplets", description: "Underground reserve with an overhead tank." },
  { name: "Gas connection", nameBn: "গ্যাস সংযোগ", icon: "flame-kindling", description: "Titas line to the kitchen." },
  { name: "Rooftop terrace", nameBn: "ছাদের টেরেস", icon: "sun", description: "Shared roof, finished and railed." },
  { name: "Gymnasium", nameBn: "জিমনেসিয়াম", icon: "dumbbell", description: "Equipped gym for residents." },
  { name: "Swimming pool", nameBn: "সুইমিং পুল", icon: "waves", description: "Filtered pool with a changing room." },
  { name: "Community hall", nameBn: "কমিউনিটি হল", icon: "users", description: "Bookable hall for gatherings." },
  { name: "Prayer room", nameBn: "নামাজের কক্ষ", icon: "moon-star", description: "Dedicated prayer space in the building." },
  { name: "Children's play area", nameBn: "শিশুদের খেলার জায়গা", icon: "baby", description: "Enclosed play space." },
  { name: "Landscaped garden", nameBn: "ল্যান্ডস্কেপ করা বাগান", icon: "trees", description: "Planted and maintained garden." },
  { name: "Servant quarter", nameBn: "সার্ভেন্ট কোয়ার্টার", icon: "door-open", description: "Separate room with its own washroom." },
  { name: "Balcony", nameBn: "বারান্দা", icon: "panel-top", description: "Open balcony off the living room." },
  { name: "Solar panel", nameBn: "সোলার প্যানেল", icon: "sun-medium", description: "Rooftop solar feeding common areas." },
  { name: "Visitor lounge", nameBn: "অতিথি লাউঞ্জ", icon: "sofa", description: "Ground-floor waiting lounge." },
];

/**
 * Which amenities each seeded listing carries.
 *
 * Every building has the first five; the rest depend on what it is. A
 * commercial floor has no play area, and a 1,420 sq ft flat in Uttara has no
 * servant quarter — a demo catalogue where every listing has all twenty tells
 * nobody anything.
 */
const CORE = [
  "Lift",
  "Standby generator",
  "Reserved parking",
  "24/7 security",
  "CCTV surveillance",
];

const EXTRA: Record<string, string[]> = {
  "ZP-2026-0002": ["Intercom", "Rooftop terrace", "Gymnasium", "Servant quarter", "Balcony", "Fire safety system"],
  "ZP-2026-0003": ["Swimming pool", "Gymnasium", "Rooftop terrace", "Servant quarter", "Visitor lounge", "Intercom", "Landscaped garden"],
  "ZP-2026-0004": ["Balcony", "Intercom", "Rooftop terrace", "Fire safety system"],
  "ZP-2026-0005": ["Balcony", "Gas connection", "Community hall", "Water reservoir and pump"],
  "ZP-2026-0006": ["Balcony", "Gas connection", "Children's play area", "Prayer room"],
  "ZP-2026-0007": ["Balcony", "Gas connection", "Community hall", "Children's play area"],
  "ZP-2026-0008": ["Landscaped garden", "Servant quarter", "Water reservoir and pump", "Solar panel", "Gas connection"],
  "ZP-2026-0009": ["Fire safety system", "Visitor lounge", "Water reservoir and pump"],
  "ZP-2026-0010": ["Balcony", "Landscaped garden", "Children's play area", "Prayer room", "Intercom"],
  "ZP-2026-0011": ["Landscaped garden", "Balcony", "Gas connection", "Community hall"],
};

const run = async () => {
  if (!config.db_url) throw new Error("DB_URL is not set.");

  await mongoose.connect(config.db_url);
  console.log(`🛢  Connected to ${mongoose.connection.name}`);

  let made = 0;
  for (const [i, a] of AMENITIES.entries()) {
    const existing = await PropertyAmenity.findOne({ name: a.name }).select("_id");
    if (existing) {
      console.log(`   = ${a.name}`);
      continue;
    }
    await PropertyAmenity.create({ ...a, order: i + 1, isActive: true });
    made += 1;
    console.log(`   + ${a.name}`);
  }

  const all = await PropertyAmenity.find({}).select("_id name").lean();
  const idByName = new Map(all.map((a: any) => [a.name, a._id]));
  const ids = (names: string[]) => names.map((n) => idByName.get(n)).filter(Boolean);

  let attached = 0;
  for (const [ref, extra] of Object.entries(EXTRA)) {
    const property = await Property.findOne({
      referenceNo: ref,
      isDeleted: { $ne: true },
    }).select("_id amenities");
    if (!property) continue;
    // Only fill in a listing that has none — never overwrite a real edit.
    if (property.amenities?.length) {
      console.log(`   = ${ref} already has amenities`);
      continue;
    }
    const list = ids([...CORE, ...extra]);
    await Property.updateOne({ _id: property._id }, { $set: { amenities: list } });
    attached += 1;
    console.log(`   → ${ref}: ${list.length} amenities`);
  }

  console.log(`✅ ${made} amenity(ies) created, attached to ${attached} listing(s)`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
