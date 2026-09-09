import mongoose from "mongoose";

import config from "../app/config";
import { Area } from "../app/modules/area/area.model";
import { Media } from "../app/modules/media-library/media-library.model";
import { Project } from "../app/modules/project/project.model";
import { ProjectService } from "../app/modules/project/project.service";
import { Property } from "../app/modules/property/property.model";
import { PropertyService } from "../app/modules/property/property.service";

/**
 * Ten developments and ten listings, for a panel that has something to show.
 *
 * Written through the services rather than straight into the collections, so
 * every record gets the reference number, slug, progress figure and history
 * entry it would have got had somebody typed it in — seed data that skips the
 * service is seed data that behaves differently from the real thing, and the
 * first bug it hides is the one in the service.
 *
 * Idempotent: a project or listing whose name already exists is left alone, so
 * running it twice does not double the catalogue.
 *
 *   npm run seed:listings
 */

type ProjectSeed = {
  name: string;
  nameBn: string;
  developer: string;
  area: string;
  stage: "Planning" | "Processing" | "Completed";
  handover: string;
  units: number;
  unitsLeft: number;
  sizeRange: string;
  startingPrice: number;
  rajukPermitNo: string;
  isHome: boolean;
  featured: boolean;
  milestones: { label: string; labelBn: string; percent: number; completed: boolean }[];
  description: string;
};

const PROJECTS: ProjectSeed[] = [
  {
    name: "Navana Platinum Residence",
    nameBn: "নাভানা প্ল্যাটিনাম রেসিডেন্স",
    developer: "Navana Real Estate",
    area: "Gulshan (1 & 2)",
    stage: "Processing",
    handover: "Q4 2027",
    units: 48,
    unitsLeft: 19,
    sizeRange: "2,150 – 3,400 sq ft",
    startingPrice: 68000000,
    rajukPermitNo: "RAJUK/GUL/2024/0118",
    isHome: true,
    featured: true,
    milestones: [
      { label: "Deep piling and raft", labelBn: "গভীর পাইলিং ও র‍্যাফট", percent: 25, completed: true },
      { label: "Structure to 12th floor", labelBn: "১২ তলা পর্যন্ত কাঠামো", percent: 35, completed: true },
      { label: "Curtain wall glazing", labelBn: "কার্টেন ওয়াল গ্লেজিং", percent: 20, completed: false },
      { label: "Fit-out and handover", labelBn: "ফিট-আউট ও হস্তান্তর", percent: 20, completed: false },
    ],
    description:
      "Forty-eight apartments on a corner plot two minutes from Gulshan 2 circle, with the RAJUK plan and the title deed cleared before a single unit was offered.",
  },
  {
    name: "Assurance Lake Terrace",
    nameBn: "অ্যাসিওরেন্স লেক টেরেস",
    developer: "Assurance Developments",
    area: "Banani",
    stage: "Processing",
    handover: "Q2 2027",
    units: 36,
    unitsLeft: 11,
    sizeRange: "1,850 – 2,600 sq ft",
    startingPrice: 52000000,
    rajukPermitNo: "RAJUK/BAN/2024/0342",
    isHome: true,
    featured: false,
    milestones: [
      { label: "Piling complete", labelBn: "পাইলিং সম্পন্ন", percent: 20, completed: true },
      { label: "Basement and podium", labelBn: "বেসমেন্ট ও পোডিয়াম", percent: 25, completed: true },
      { label: "Superstructure", labelBn: "সুপারস্ট্রাকচার", percent: 35, completed: false },
      { label: "Finishing", labelBn: "ফিনিশিং", percent: 20, completed: false },
    ],
    description:
      "Lake-facing apartments on the quiet side of Banani, every second unit turning a corner so the water is visible from both the living room and the master bedroom.",
  },
  {
    name: "Baridhara Sky Court",
    nameBn: "বারিধারা স্কাই কোর্ট",
    developer: "Concord Group",
    area: "Baridhara Diplomatic Zone",
    stage: "Completed",
    handover: "Ready",
    units: 24,
    unitsLeft: 3,
    sizeRange: "2,900 – 4,100 sq ft",
    startingPrice: 115000000,
    rajukPermitNo: "RAJUK/BAR/2021/0077",
    isHome: true,
    featured: true,
    milestones: [
      { label: "Structure", labelBn: "কাঠামো", percent: 40, completed: true },
      { label: "Finishing", labelBn: "ফিনিশিং", percent: 35, completed: true },
      { label: "Handover and occupancy", labelBn: "হস্তান্তর ও দখল", percent: 25, completed: true },
    ],
    description:
      "Twenty-four residences inside the diplomatic zone, handed over on schedule in 2026 with occupancy certificates issued for every floor.",
  },
  {
    name: "Dhanmondi Heritage Park",
    nameBn: "ধানমন্ডি হেরিটেজ পার্ক",
    developer: "Building Technology & Ideas",
    area: "Dhanmondi",
    stage: "Planning",
    handover: "Q1 2029",
    units: 60,
    unitsLeft: 60,
    sizeRange: "1,450 – 2,300 sq ft",
    startingPrice: 34000000,
    rajukPermitNo: "RAJUK/DHN/2026/0009",
    isHome: false,
    featured: false,
    milestones: [
      { label: "Land acquisition and survey", labelBn: "জমি অধিগ্রহণ ও জরিপ", percent: 15, completed: true },
      { label: "RAJUK design approval", labelBn: "রাজউক নকশা অনুমোদন", percent: 20, completed: false },
      { label: "Construction", labelBn: "নির্মাণ", percent: 45, completed: false },
      { label: "Handover", labelBn: "হস্তান্তর", percent: 20, completed: false },
    ],
    description:
      "Sixty apartments beside Dhanmondi lake, held at design stage until the RAJUK approval is in hand rather than sold off a drawing.",
  },
  {
    name: "Uttara Green Meadows",
    nameBn: "উত্তরা গ্রিন মেডোজ",
    developer: "Rangs Properties",
    area: "Uttara (Sectors 1-14)",
    stage: "Processing",
    handover: "Q3 2028",
    units: 84,
    unitsLeft: 51,
    sizeRange: "1,250 – 1,900 sq ft",
    startingPrice: 21000000,
    rajukPermitNo: "RAJUK/UTT/2025/0451",
    isHome: false,
    featured: false,
    milestones: [
      { label: "Soil treatment and piling", labelBn: "মাটি শোধন ও পাইলিং", percent: 25, completed: true },
      { label: "Structure", labelBn: "কাঠামো", percent: 40, completed: false },
      { label: "Finishing and landscaping", labelBn: "ফিনিশিং ও ল্যান্ডস্কেপিং", percent: 35, completed: false },
    ],
    description:
      "Eighty-four family apartments across two towers in Sector 11, with the metro station a nine-minute walk from the gate.",
  },
  {
    name: "Bashundhara Riverfront",
    nameBn: "বসুন্ধরা রিভারফ্রন্ট",
    developer: "Bashundhara Group",
    area: "Bashundhara Residential Area",
    stage: "Processing",
    handover: "Q4 2028",
    units: 120,
    unitsLeft: 88,
    sizeRange: "1,100 – 2,050 sq ft",
    startingPrice: 18500000,
    rajukPermitNo: "RAJUK/BSD/2025/0612",
    isHome: false,
    featured: false,
    milestones: [
      { label: "Piling", labelBn: "পাইলিং", percent: 20, completed: true },
      { label: "Podium and parking", labelBn: "পোডিয়াম ও পার্কিং", percent: 20, completed: false },
      { label: "Towers A and B", labelBn: "টাওয়ার এ ও বি", percent: 40, completed: false },
      { label: "Handover", labelBn: "হস্তান্তর", percent: 20, completed: false },
    ],
    description:
      "A hundred and twenty units in Block I, the first phase of a riverfront masterplan with its own school plot and clinic.",
  },
  {
    name: "Mirpur DOHS Officers Court",
    nameBn: "মিরপুর ডিওএইচএস অফিসার্স কোর্ট",
    developer: "Sheltech",
    area: "Mirpur DOHS",
    stage: "Completed",
    handover: "Ready",
    units: 32,
    unitsLeft: 5,
    sizeRange: "1,600 – 2,100 sq ft",
    startingPrice: 28000000,
    rajukPermitNo: "RAJUK/MIR/2022/0233",
    isHome: false,
    featured: true,
    milestones: [
      { label: "Structure", labelBn: "কাঠামো", percent: 45, completed: true },
      { label: "Finishing", labelBn: "ফিনিশিং", percent: 35, completed: true },
      { label: "Handover", labelBn: "হস্তান্তর", percent: 20, completed: true },
    ],
    description:
      "Thirty-two apartments inside the DOHS perimeter, completed and occupied, with five resale units still on the books.",
  },
  {
    name: "Mohakhali Business Bay",
    nameBn: "মহাখালী বিজনেস বে",
    developer: "Amin Mohammad Foundation",
    area: "Mohakhali DOHS",
    stage: "Planning",
    handover: "Q2 2029",
    units: 40,
    unitsLeft: 40,
    sizeRange: "2,400 – 6,000 sq ft",
    startingPrice: 72000000,
    rajukPermitNo: "RAJUK/MOH/2026/0031",
    isHome: false,
    featured: false,
    milestones: [
      { label: "Feasibility and design", labelBn: "সম্ভাব্যতা ও নকশা", percent: 20, completed: true },
      { label: "Approvals", labelBn: "অনুমোদন", percent: 20, completed: false },
      { label: "Construction", labelBn: "নির্মাণ", percent: 45, completed: false },
      { label: "Fit-out", labelBn: "ফিট-আউট", percent: 15, completed: false },
    ],
    description:
      "Forty commercial floors on the Mohakhali link road, sized for single-tenant offices rather than partitioned suites.",
  },
  {
    name: "Nikunja Courtyard Homes",
    nameBn: "নিকুঞ্জ কোর্টইয়ার্ড হোমস",
    developer: "Anwar Landmark",
    area: "Nikunja 1 & 2",
    stage: "Processing",
    handover: "Q1 2028",
    units: 28,
    unitsLeft: 14,
    sizeRange: "1,700 – 2,250 sq ft",
    startingPrice: 31000000,
    rajukPermitNo: "RAJUK/NIK/2025/0188",
    isHome: false,
    featured: false,
    milestones: [
      { label: "Piling and raft", labelBn: "পাইলিং ও র‍্যাফট", percent: 25, completed: true },
      { label: "Structure", labelBn: "কাঠামো", percent: 40, completed: true },
      { label: "Finishing", labelBn: "ফিনিশিং", percent: 35, completed: false },
    ],
    description:
      "Twenty-eight apartments arranged around a planted courtyard, eight minutes from the airport road without fronting it.",
  },
  {
    name: "Lalmatia Garden Residence",
    nameBn: "লালমাটিয়া গার্ডেন রেসিডেন্স",
    developer: "Suvastu Properties",
    area: "Lalmatia",
    stage: "Completed",
    handover: "Ready",
    units: 18,
    unitsLeft: 2,
    sizeRange: "1,500 – 1,950 sq ft",
    startingPrice: 26500000,
    rajukPermitNo: "RAJUK/LAL/2021/0294",
    isHome: false,
    featured: false,
    milestones: [
      { label: "Structure", labelBn: "কাঠামো", percent: 45, completed: true },
      { label: "Finishing", labelBn: "ফিনিশিং", percent: 35, completed: true },
      { label: "Handover", labelBn: "হস্তান্তর", percent: 20, completed: true },
    ],
    description:
      "Eighteen apartments on a mature street in Block C, handed over in 2025 with the rooftop garden already established.",
  },
];

type PropertySeed = {
  title: string;
  titleBn: string;
  type: "apartment" | "duplex" | "house" | "commercial" | "land";
  status: "available" | "reserved" | "sold" | "draft";
  price: number;
  area: string;
  addressLine: string;
  beds: number;
  baths: number;
  size: number;
  floor?: string;
  parking?: number;
  furnishing: "Unfurnished" | "Semi-furnished" | "Fully furnished";
  handover?: string;
  rajukApproved: boolean;
  badge?: "New" | "Featured" | "Exclusive" | "Verified" | "Price drop";
  featured: boolean;
  isHome: boolean;
  /** Name of the project this listing sits inside, if any. */
  project?: string;
  description: string;
};

const PROPERTIES: PropertySeed[] = [
  {
    title: "Corner apartment with lake view, Gulshan 2",
    titleBn: "লেক ভিউ কর্নার অ্যাপার্টমেন্ট, গুলশান ২",
    type: "apartment",
    status: "available",
    price: 74500000,
    area: "Gulshan (1 & 2)",
    addressLine: "Road 41, Gulshan 2",
    beds: 4,
    baths: 4,
    size: 3150,
    floor: "9th of 12",
    parking: 2,
    furnishing: "Semi-furnished",
    handover: "Ready",
    rajukApproved: true,
    badge: "Exclusive",
    featured: true,
    isHome: true,
    project: "Navana Platinum Residence",
    description:
      "A corner unit on the ninth floor with the lake on two sides, south-facing living room and a service entrance separate from the main door.",
  },
  {
    title: "Duplex penthouse, Baridhara diplomatic zone",
    titleBn: "ডুপ্লেক্স পেন্টহাউস, বারিধারা কূটনৈতিক এলাকা",
    type: "duplex",
    status: "available",
    price: 168000000,
    area: "Baridhara Diplomatic Zone",
    addressLine: "Road 11, Baridhara",
    beds: 5,
    baths: 6,
    size: 5200,
    floor: "11th & 12th",
    parking: 3,
    furnishing: "Fully furnished",
    handover: "Ready",
    rajukApproved: true,
    badge: "Featured",
    featured: true,
    isHome: true,
    project: "Baridhara Sky Court",
    description:
      "Two floors joined by an internal stair, a private roof terrace above, and embassy-grade security on the gate. Handed over with the fit-out complete.",
  },
  {
    title: "Lake-facing apartment, Banani Road 12",
    titleBn: "লেকমুখী অ্যাপার্টমেন্ট, বনানী রোড ১২",
    type: "apartment",
    status: "available",
    price: 56000000,
    area: "Banani",
    addressLine: "Road 12, Block E, Banani",
    beds: 3,
    baths: 3,
    size: 2400,
    floor: "6th of 10",
    parking: 2,
    furnishing: "Unfurnished",
    handover: "Q2 2027",
    rajukApproved: true,
    badge: "New",
    featured: false,
    isHome: true,
    project: "Assurance Lake Terrace",
    description:
      "Water visible from the living room and both bedrooms on the lake side. Handover mid-2027, with the structure already topped out.",
  },
  {
    title: "Family apartment near Dhanmondi lake",
    titleBn: "ধানমন্ডি লেকের পাশে পারিবারিক অ্যাপার্টমেন্ট",
    type: "apartment",
    status: "available",
    price: 32500000,
    area: "Dhanmondi",
    addressLine: "Road 8/A, Dhanmondi",
    beds: 3,
    baths: 3,
    size: 1850,
    floor: "4th of 8",
    parking: 1,
    furnishing: "Semi-furnished",
    handover: "Ready",
    rajukApproved: true,
    badge: "Verified",
    featured: false,
    isHome: true,
    description:
      "A four-minute walk to the lake path, on a street with two schools and no through traffic. Papers verified and the mutation complete.",
  },
  {
    title: "Three-bed in Uttara Sector 11",
    titleBn: "উত্তরা সেক্টর ১১-এ তিন বেডরুম",
    type: "apartment",
    status: "available",
    price: 19800000,
    area: "Uttara (Sectors 1-14)",
    addressLine: "Sector 11, Uttara",
    beds: 3,
    baths: 2,
    size: 1420,
    floor: "5th of 9",
    parking: 1,
    furnishing: "Unfurnished",
    handover: "Q3 2028",
    rajukApproved: true,
    featured: false,
    isHome: false,
    project: "Uttara Green Meadows",
    description:
      "Nine minutes on foot to the metro station, with a school and the sector park both inside a ten-minute walk.",
  },
  {
    title: "Ready apartment, Mirpur DOHS",
    titleBn: "প্রস্তুত অ্যাপার্টমেন্ট, মিরপুর ডিওএইচএস",
    type: "apartment",
    status: "reserved",
    price: 29500000,
    area: "Mirpur DOHS",
    addressLine: "Avenue 3, Mirpur DOHS",
    beds: 3,
    baths: 3,
    size: 1780,
    floor: "3rd of 7",
    parking: 1,
    furnishing: "Semi-furnished",
    handover: "Ready",
    rajukApproved: true,
    badge: "Price drop",
    featured: false,
    isHome: false,
    project: "Mirpur DOHS Officers Court",
    description:
      "Inside the DOHS perimeter with its own gate and generator backup. Reserved pending the buyer's loan sanction.",
  },
  {
    title: "Independent house on 5 katha, Bashundhara Block K",
    titleBn: "৫ কাঠায় স্বতন্ত্র বাড়ি, বসুন্ধরা ব্লক কে",
    type: "house",
    status: "available",
    price: 94000000,
    area: "Bashundhara Residential Area",
    addressLine: "Block K, Bashundhara R/A",
    beds: 6,
    baths: 5,
    size: 4600,
    parking: 3,
    furnishing: "Unfurnished",
    handover: "Ready",
    rajukApproved: true,
    featured: false,
    isHome: false,
    description:
      "Three storeys on five katha with a garden at the back and parking for three inside the boundary wall. Title deed and mutation both clear.",
  },
  {
    title: "Commercial floor, Kawran Bazar",
    titleBn: "বাণিজ্যিক ফ্লোর, কারওয়ান বাজার",
    type: "commercial",
    status: "available",
    price: 82000000,
    area: "Kawran Bazar",
    addressLine: "Kazi Nazrul Islam Avenue",
    beds: 0,
    baths: 4,
    size: 4200,
    floor: "7th of 14",
    parking: 4,
    furnishing: "Unfurnished",
    handover: "Ready",
    rajukApproved: true,
    featured: false,
    isHome: false,
    description:
      "A full floor with its own lift lobby, sized for one tenant rather than partitioned suites. Two lifts, and a substation on site.",
  },
  {
    title: "Courtyard apartment, Nikunja 2",
    titleBn: "কোর্টইয়ার্ড অ্যাপার্টমেন্ট, নিকুঞ্জ ২",
    type: "apartment",
    status: "available",
    price: 33800000,
    area: "Nikunja 1 & 2",
    addressLine: "Nikunja 2, Khilkhet",
    beds: 3,
    baths: 3,
    size: 1950,
    floor: "5th of 8",
    parking: 1,
    furnishing: "Unfurnished",
    handover: "Q1 2028",
    rajukApproved: true,
    badge: "New",
    featured: false,
    isHome: false,
    project: "Nikunja Courtyard Homes",
    description:
      "Facing the planted courtyard rather than the road, so the airport traffic is audible from neither bedroom.",
  },
  {
    title: "Garden-level apartment, Lalmatia Block C",
    titleBn: "গার্ডেন লেভেল অ্যাপার্টমেন্ট, লালমাটিয়া ব্লক সি",
    type: "apartment",
    status: "sold",
    price: 27400000,
    area: "Lalmatia",
    addressLine: "Block C, Lalmatia",
    beds: 3,
    baths: 2,
    size: 1620,
    floor: "1st of 6",
    parking: 1,
    furnishing: "Semi-furnished",
    handover: "Ready",
    rajukApproved: true,
    featured: false,
    isHome: false,
    project: "Lalmatia Garden Residence",
    description:
      "Ground-floor apartment opening onto the shared garden. Sold in August; kept on the books for the reference photographs.",
  },
];

const run = async () => {
  if (!config.db_url) throw new Error("DB_URL is not set.");

  await mongoose.connect(config.db_url);
  console.log(`🛢  Connected to ${mongoose.connection.name}`);

  const areas = await Area.find({ isDeleted: { $ne: true } }).select("_id name");
  if (!areas.length) {
    throw new Error("No areas exist — seed areas before listings.");
  }
  const areaByName = new Map(areas.map((a) => [a.name, a._id]));
  const areaFor = (name: string) => areaByName.get(name) ?? areas[0]._id;

  // Existing library images, cycled, so a seeded card is not a broken frame.
  const media = await Media.find({}).select("_id").limit(10).lean();
  const pick = (i: number) => (media.length ? media[i % media.length]._id : undefined);
  const gallery = (i: number) =>
    media.length
      ? [pick(i), pick(i + 1), pick(i + 2)].filter(Boolean)
      : [];

  let projectsMade = 0;
  const projectIdByName = new Map<string, unknown>();

  for (const [i, seed] of PROJECTS.entries()) {
    const existing = await Project.findOne({
      name: seed.name,
      isDeleted: { $ne: true },
    }).select("_id");
    if (existing) {
      projectIdByName.set(seed.name, existing._id);
      console.log(`   = ${seed.name} (already there)`);
      continue;
    }

    const created: any = await ProjectService.createProject({
      name: seed.name,
      nameBn: seed.nameBn,
      developer: seed.developer,
      area: areaFor(seed.area),
      city: "Dhaka",
      stage: seed.stage,
      handover: seed.handover,
      units: seed.units,
      unitsLeft: seed.unitsLeft,
      sizeRange: seed.sizeRange,
      startingPrice: seed.startingPrice,
      rajukPermitNo: seed.rajukPermitNo,
      coverImage: pick(i),
      images: gallery(i),
      description: [seed.description],
      milestones: seed.milestones,
      lastInspected: new Date(),
      featured: seed.featured,
      isHome: seed.isHome,
      isActive: true,
    } as any);

    projectIdByName.set(seed.name, created._id);
    projectsMade += 1;
    console.log(`   + ${seed.name} (${seed.stage}, ${created.progress}%)`);
  }

  let propertiesMade = 0;

  for (const [i, seed] of PROPERTIES.entries()) {
    const existing = await Property.findOne({
      title: seed.title,
      isDeleted: { $ne: true },
    }).select("_id");
    if (existing) {
      console.log(`   = ${seed.title} (already there)`);
      continue;
    }

    const created: any = await PropertyService.createProperty({
      title: seed.title,
      titleBn: seed.titleBn,
      purpose: "sale",
      type: seed.type,
      status: seed.status,
      price: seed.price,
      area: areaFor(seed.area),
      city: "Dhaka",
      addressLine: seed.addressLine,
      beds: seed.beds,
      baths: seed.baths,
      size: seed.size,
      floor: seed.floor,
      parking: seed.parking,
      furnishing: seed.furnishing,
      handover: seed.handover,
      rajukApproved: seed.rajukApproved,
      coverImage: pick(i + 3),
      images: gallery(i + 3),
      description: [seed.description],
      badge: seed.badge,
      featured: seed.featured,
      isHome: seed.isHome,
      project: seed.project ? projectIdByName.get(seed.project) : undefined,
    } as any);

    propertiesMade += 1;
    console.log(`   + ${created.referenceNo}  ${seed.title}`);
  }

  console.log(
    `✅ ${projectsMade} project(s) and ${propertiesMade} listing(s) created`
  );
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
