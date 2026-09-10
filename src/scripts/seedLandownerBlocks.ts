import mongoose from "mongoose";

import config from "../app/config";
import { Media } from "../app/modules/media-library/media-library.model";
import { LandownerProject } from "../app/modules/landownerProject/landownerProject.model";

/**
 * Ten blocks for the landowners page.
 *
 * A landowner is being asked to hand over the one asset they cannot replace,
 * so the page has to answer the questions they actually ask — the share, the
 * advance, the approvals, the date, and what happens when it slips — rather
 * than repeat that we are trustworthy.
 *
 * `description` is HTML because that is what the panel's editor produces: the
 * terms read as lists, and the numbers that matter are bold.
 *
 * Idempotent on title, so running it twice does not double the page.
 *
 *   npm run seed:landowners
 */

type Block = {
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
};

const BLOCKS: Block[] = [
  {
    title: "Why choose us as a partner for your land?",
    titleBn: "আপনার জমির জন্য আমাদের কেন বেছে নেবেন?",
    description:
      "<p>Dealing with a developer in Dhaka is hard to judge from the outside — the joint venture process is bureaucratic, and the promises all sound alike.</p><p>We put the terms <strong>in the deed instead of the brochure</strong>: the owner share, the signing advance held in bank escrow, and a handover date you can enforce.</p>",
    descriptionBn:
      "<p>ঢাকায় ডেভেলপার যাচাই করা বাইরে থেকে কঠিন — যৌথ উদ্যোগের প্রক্রিয়া জটিল, আর প্রতিশ্রুতি সবারই এক রকম শোনায়।</p><p>আমরা শর্তগুলো <strong>ব্রোশিউরে নয়, চুক্তিপত্রে</strong> লিখি: মালিকের অংশ, ব্যাংক এসক্রোতে রাখা সাইনিং অগ্রিম, আর এমন হস্তান্তরের তারিখ যা আপনি আদায় করতে পারবেন।</p>",
  },
  {
    title: "What we finished, and when we said we would",
    titleBn: "আমরা যা শেষ করেছি, আর যখন বলেছিলাম",
    description:
      "<p>Every completed joint venture is on record with its plot size, the storeys built, and the share the owner kept.</p><ul><li>The Imperial Serenade — Gulshan, <strong>52% owner share</strong>, handed over 2024</li><li>Lakefront Crest — Dhanmondi, <strong>50% owner share</strong>, handed over 2023</li><li>Banani Sky Court — Banani, <strong>55% owner share</strong>, handed over 2025</li></ul><p>Ask for any of them by name and we will take you to the building.</p>",
    descriptionBn:
      "<p>প্রতিটি সম্পন্ন যৌথ উদ্যোগের নথিতে আছে জমির পরিমাণ, নির্মিত তলা এবং মালিক যে অংশ পেয়েছেন।</p><ul><li>দ্য ইম্পেরিয়াল সেরেনেড — গুলশান, <strong>৫২% মালিকের অংশ</strong>, হস্তান্তর ২০২৪</li><li>লেকফ্রন্ট ক্রেস্ট — ধানমন্ডি, <strong>৫০% মালিকের অংশ</strong>, হস্তান্তর ২০২৩</li><li>বনানী স্কাই কোর্ট — বনানী, <strong>৫৫% মালিকের অংশ</strong>, হস্তান্তর ২০২৫</li></ul><p>যেকোনো একটির নাম বলুন, আমরা আপনাকে ভবনটিতে নিয়ে যাব।</p>",
  },
  {
    title: "How a joint venture actually works",
    titleBn: "যৌথ উদ্যোগ আসলে যেভাবে কাজ করে",
    description:
      "<p>Four steps, and you sign nothing binding until the third.</p><ol><li><strong>Survey and title check</strong> — we read the deed, the mutation and the CS/RS records before we quote anything.</li><li><strong>Written offer</strong> — the share, the advance and the timeline, on paper.</li><li><strong>Registered agreement</strong> — signed at the sub-registry, not in an office.</li><li><strong>Construction and handover</strong> — with the milestones you can check.</li></ol>",
    descriptionBn:
      "<p>চারটি ধাপ, আর তৃতীয় ধাপের আগে আপনি বাধ্যতামূলক কিছুই সই করছেন না।</p><ol><li><strong>জরিপ ও দলিল যাচাই</strong> — দর বলার আগেই দলিল, নামজারি ও সিএস/আরএস রেকর্ড পড়ি।</li><li><strong>লিখিত প্রস্তাব</strong> — অংশ, অগ্রিম ও সময়সীমা, কাগজে।</li><li><strong>নিবন্ধিত চুক্তি</strong> — অফিসে নয়, সাব-রেজিস্ট্রি অফিসে সই।</li><li><strong>নির্মাণ ও হস্তান্তর</strong> — এমন মাইলফলকসহ যা আপনি যাচাই করতে পারবেন।</li></ol>",
  },
  {
    title: "What share you keep, and how it is fixed",
    titleBn: "আপনি কত অংশ রাখবেন, আর তা কীভাবে নির্ধারিত হয়",
    description:
      "<p>The owner share is <strong>50% to 55%</strong> in most of our agreements, and it is written into the registered deed before a single pile is driven.</p><p>What moves it is the plot, not the negotiation: frontage, road width, corner position and the FAR the location allows. We show you the calculation rather than announcing a number.</p>",
    descriptionBn:
      "<p>আমাদের বেশিরভাগ চুক্তিতে মালিকের অংশ <strong>৫০% থেকে ৫৫%</strong>, এবং প্রথম পাইল বসানোর আগেই তা নিবন্ধিত দলিলে লেখা থাকে।</p><p>এটি বদলায় জমির কারণে, দরকষাকষির কারণে নয়: সামনের প্রশস্ততা, রাস্তার প্রশস্ততা, কর্নার অবস্থান এবং এলাকার অনুমোদিত এফএআর। আমরা সংখ্যা ঘোষণা করি না, হিসাবটা দেখাই।</p>",
  },
  {
    title: "The signing advance, held in bank escrow",
    titleBn: "সাইনিং অগ্রিম, ব্যাংক এসক্রোতে রাখা",
    description:
      "<p>The advance is paid at signing and held in an <strong>escrow account at a scheduled bank</strong> — not in our operating account.</p><p>That matters for one reason: if the project does not start, the money is released back to you by the bank, without a case and without our signature.</p>",
    descriptionBn:
      "<p>অগ্রিম দেওয়া হয় চুক্তির সময়, আর তা রাখা হয় <strong>তফসিলি ব্যাংকের এসক্রো হিসাবে</strong> — আমাদের চলতি হিসাবে নয়।</p><p>এর গুরুত্ব একটাই: প্রকল্প শুরু না হলে ব্যাংকই টাকা আপনাকে ফেরত দেবে — মামলা ছাড়া, আমাদের সইয়ের অপেক্ষা ছাড়া।</p>",
  },
  {
    title: "RAJUK approval is our job, not yours",
    titleBn: "রাজউক অনুমোদন আমাদের কাজ, আপনার নয়",
    description:
      "<p>We handle the full regulatory file at our cost:</p><ul><li>RAJUK building plan and Special Project clearance</li><li>Fire Service and Civil Defence approval</li><li>WASA, DESCO and Titas connections</li><li>Environmental clearance where the plot requires it</li></ul><p>You are asked for documents once, at the start, and not again.</p>",
    descriptionBn:
      "<p>পুরো নিয়ন্ত্রক ফাইল আমরা নিজ খরচে সামলাই:</p><ul><li>রাজউক নকশা ও বিশেষ প্রকল্প ছাড়পত্র</li><li>ফায়ার সার্ভিস ও সিভিল ডিফেন্স অনুমোদন</li><li>ওয়াসা, ডেসকো ও তিতাস সংযোগ</li><li>প্রয়োজন হলে পরিবেশগত ছাড়পত্র</li></ul><p>কাগজপত্র আপনার কাছে একবারই চাওয়া হবে, শুরুতে — আর নয়।</p>",
  },
  {
    title: "Built to BNBC 2020, and tested for it",
    titleBn: "বিএনবিসি ২০২০ মেনে নির্মাণ, এবং তার পরীক্ষা",
    description:
      "<p>The structural design is vetted by a BUET-affiliated engineer and built to the <strong>BNBC 2020 seismic code</strong> for Zone 2 and 3.</p><p>Pile depth is confirmed by ultrasonic testing, and every concrete pour has a cylinder test with the report filed against the milestone. The reports are yours to keep.</p>",
    descriptionBn:
      "<p>কাঠামোগত নকশা বুয়েট-সংশ্লিষ্ট প্রকৌশলী যাচাই করেন, আর নির্মাণ হয় জোন ২ ও ৩-এর জন্য <strong>বিএনবিসি ২০২০ ভূমিকম্প কোড</strong> অনুযায়ী।</p><p>পাইলের গভীরতা আল্ট্রাসনিক পরীক্ষায় নিশ্চিত করা হয়, আর প্রতিটি ঢালাইয়ের সিলিন্ডার টেস্ট রিপোর্ট মাইলফলকের সঙ্গে সংরক্ষিত থাকে। রিপোর্টগুলো আপনার।</p>",
  },
  {
    title: "The handover date, and what a delay costs us",
    titleBn: "হস্তান্তরের তারিখ, আর বিলম্বে আমাদের যা গুনতে হয়",
    description:
      "<p>Construction is pledged at <strong>36 months</strong> from the approved plan, written into the agreement as a date rather than a season.</p><p>If we miss it for a reason that is ours, the agreement carries <strong>per-day compensation</strong> payable to you. A clause you can enforce is worth more than an apology you cannot.</p>",
    descriptionBn:
      "<p>অনুমোদিত নকশা থেকে <strong>৩৬ মাসের</strong> নির্মাণ অঙ্গীকার, চুক্তিতে ঋতু নয় — তারিখ হিসেবে লেখা।</p><p>আমাদের দায়ে সময় পেরোলে চুক্তিতে আপনার জন্য <strong>প্রতিদিনের ক্ষতিপূরণ</strong> রাখা আছে। যে ধারা আদায় করা যায়, তা এমন দুঃখপ্রকাশের চেয়ে দামি যা আদায় করা যায় না।</p>",
  },
  {
    title: "What you can watch while we build",
    titleBn: "নির্মাণের সময় আপনি যা দেখতে পাবেন",
    description:
      "<p>Every landowner gets a dashboard login for the duration of the build. On it:</p><ul><li>Live CCTV from the site</li><li>A monthly surveyor's report, dated and photographed</li><li>The milestone ledger — what is done, what is next, what it cost</li></ul><p>Nobody should have to drive to a site to find out whether work has started.</p>",
    descriptionBn:
      "<p>নির্মাণকাল জুড়ে প্রত্যেক জমির মালিক একটি ড্যাশবোর্ড লগইন পান। সেখানে থাকে:</p><ul><li>সাইট থেকে সরাসরি সিসিটিভি</li><li>প্রতি মাসে সার্ভেয়ারের প্রতিবেদন, তারিখ ও ছবিসহ</li><li>মাইলফলকের হিসাব — কী হয়েছে, পরে কী, খরচ কত</li></ul><p>কাজ শুরু হয়েছে কি না জানতে কাউকে সাইটে ছুটতে হবে না।</p>",
  },
  {
    title: "After handover, what we still owe you",
    titleBn: "হস্তান্তরের পরেও আমরা যা দিতে বাধ্য",
    description:
      "<p>The relationship does not end at the keys. Owner units carry:</p><ul><li><strong>Structural warranty</strong> on the frame</li><li>Facility management — security, lifts, generator and pumps</li><li>A defects window with a named person to call, not a hotline</li></ul><p>Utility connections are pre-planned with dedicated sub-meters, so no owner inherits somebody else's bill.</p>",
    descriptionBn:
      "<p>চাবি হস্তান্তরেই সম্পর্ক শেষ হয় না। মালিকের ইউনিটে থাকে:</p><ul><li>কাঠামোর ওপর <strong>স্ট্রাকচারাল ওয়ারেন্টি</strong></li><li>ফ্যাসিলিটি ব্যবস্থাপনা — নিরাপত্তা, লিফট, জেনারেটর ও পাম্প</li><li>ত্রুটি সংশোধনের নির্দিষ্ট সময়, আর হটলাইন নয় — নাম ধরে ডাকার মতো একজন মানুষ</li></ul><p>ইউটিলিটি সংযোগ আগেই পরিকল্পিত, আলাদা সাব-মিটারসহ — কেউ অন্যের বিল বইবেন না।</p>",
  },
];

const run = async () => {
  if (!config.db_url) throw new Error("DB_URL is not set.");

  await mongoose.connect(config.db_url);
  console.log(`🛢  Connected to ${mongoose.connection.name}`);

  // Existing library images, cycled, so no block renders as a blank frame.
  const media = await Media.find({}).select("_id").limit(10).lean();
  const pick = (i: number) =>
    media.length ? media[i % media.length]._id : undefined;

  let made = 0;
  for (const [i, block] of BLOCKS.entries()) {
    const existing = await LandownerProject.findOne({
      title: block.title,
      isDeleted: { $ne: true },
    }).select("_id");

    if (existing) {
      // Keep the order stable even when the row was seeded earlier.
      await LandownerProject.updateOne({ _id: existing._id }, { $set: { order: i + 1 } });
      console.log(`   = ${block.title.slice(0, 48)}`);
      continue;
    }

    await LandownerProject.create({
      ...block,
      image: pick(i),
      order: i + 1,
      isHome: true,
      isPublished: true,
    });
    made += 1;
    console.log(`   + ${block.title.slice(0, 48)}`);
  }

  const total = await LandownerProject.countDocuments({ isDeleted: { $ne: true } });
  console.log(`✅ ${made} block(s) created — ${total} on the landowners page`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
