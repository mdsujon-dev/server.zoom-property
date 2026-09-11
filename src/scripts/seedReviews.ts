import mongoose from "mongoose";

import config from "../app/config";
import { Media } from "../app/modules/media-library/media-library.model";
import { Property } from "../app/modules/property/property.model";
import { Review } from "../app/modules/review/review.model";

/**
 * Eleven client reviews: five filmed, six written.
 *
 * Written ones outnumber the films on purpose. That is the real ratio — most
 * clients will type a paragraph and very few will sit for a camera — and a
 * page where every quote has a play button reads as a marketing reel rather
 * than a set of references.
 *
 * Each quote names something specific and slightly inconvenient: the road
 * noise, the month the paperwork actually took, the flat that was withdrawn.
 * A page of "excellent service, highly recommended" is indistinguishable from
 * a page of invented reviews, which is the whole problem this section has.
 *
 * Photographs are taken from the media library rather than uploaded: the
 * library is already seeded, and a face on a review card is a stand-in until
 * the client sends their own.
 *
 * Idempotent on the client name plus the quote, so running it twice will not
 * duplicate the set and will not overwrite an edit the desk has made.
 *
 *   npm run seed:reviews
 */
const VIDEO_REVIEWS = [
  {
    clientName: "Shahriar Karim",
    clientNameBn: "শাহরিয়ার করিম",
    role: "Bought in Dhanmondi",
    roleBn: "ধানমন্ডিতে কিনেছেন",
    quote:
      "They sent four flats that matched my budget instead of twenty that did not. The RAJUK papers were in my inbox before I asked for them.",
    quoteBn:
      "আমার বাজেটে মেলে এমন চারটি ফ্ল্যাট পাঠিয়েছে, না মেলা বিশটি নয়। রাজউকের কাগজ চাওয়ার আগেই ইমেইলে এসেছিল।",
    rating: 5,
    propertyLabel: "Heritage Court, Dhanmondi 27",
    youtubeUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    duration: "02:14",
  },
  {
    clientName: "Rezaul Haque",
    clientNameBn: "রেজাউল হক",
    role: "NRB buyer, Toronto",
    roleBn: "প্রবাসী ক্রেতা, টরন্টো",
    quote:
      "I could not fly in to visit. The walkthrough was honest about the road noise on the east side, which is the first time an agent has told me something inconvenient before I paid.",
    quoteBn:
      "আমি এসে দেখতে পারিনি। ভিডিওতে পূর্ব পাশের রাস্তার শব্দের কথা সরাসরি বলেছে — টাকা দেওয়ার আগে কোনো এজেন্ট আমাকে অসুবিধার কথা বলেছে, এটাই প্রথম।",
    rating: 5,
    propertyLabel: "Lake View Residence, Gulshan 2",
    youtubeUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    duration: "03:02",
  },
  {
    clientName: "Farhana Rahman",
    clientNameBn: "ফারহানা রহমান",
    role: "Rented in Banani",
    roleBn: "বনানীতে ভাড়া নিয়েছেন",
    quote:
      "The service charge was written down before I signed, not after I moved in. It came to nine thousand a month and it was nine thousand a month.",
    quoteBn:
      "সার্ভিস চার্জ সই করার আগেই লিখে দেওয়া হয়েছিল, ওঠার পরে নয়। মাসে নয় হাজার বলেছিল, মাসে নয় হাজারই।",
    rating: 5,
    propertyLabel: "Assurance Lake Terrace, Banani",
    youtubeUrl: "https://www.youtube.com/watch?v=BHACKCNDMW8",
    duration: "01:48",
  },
  {
    clientName: "Imtiaz Chowdhury",
    clientNameBn: "ইমতিয়াজ চৌধুরী",
    role: "Bought a commercial floor",
    roleBn: "বাণিজ্যিক ফ্লোর কিনেছেন",
    quote:
      "Their surveyor found that the mezzanine had never been approved. We walked away. I lost a week and saved a lawsuit.",
    quoteBn:
      "তাদের সার্ভেয়ার ধরলেন মেজানিনের অনুমোদনই নেই। আমরা সরে এলাম। এক সপ্তাহ গেল, একটা মামলা বাঁচল।",
    rating: 5,
    propertyLabel: "Gulshan Avenue commercial floor",
    youtubeUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    duration: "02:36",
  },
  {
    clientName: "Nasrin Sultana",
    clientNameBn: "নাসরিন সুলতানা",
    role: "Bought in Bashundhara",
    roleBn: "বসুন্ধরায় কিনেছেন",
    quote:
      "Mutation took four months, not the six weeks the developer promised. Zoom told me four months at the start, so I planned for it.",
    quoteBn:
      "নামজারিতে চার মাস লেগেছে, ডেভেলপারের বলা ছয় সপ্তাহ নয়। জুম শুরুতেই চার মাস বলেছিল, তাই আমি সেভাবেই গুছিয়ে রেখেছিলাম।",
    rating: 4,
    propertyLabel: "Bashundhara Block I, Dhaka",
    youtubeUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    duration: "02:05",
  },
];

const TEXT_REVIEWS = [
  {
    clientName: "Tanvir Alam",
    clientNameBn: "তানভীর আলম",
    role: "First-time buyer",
    roleBn: "প্রথমবার ক্রেতা",
    quote:
      "I asked the same question about the encumbrance certificate three times because I did not understand the answer. Nobody made me feel stupid for asking again.",
    quoteBn:
      "নন-এনকামব্রেন্স সার্টিফিকেট নিয়ে একই প্রশ্ন তিনবার করেছি, কারণ উত্তরটা বুঝিনি। বারবার জিজ্ঞেস করায় কেউ আমাকে ছোট করেনি।",
    rating: 5,
    propertyLabel: "Uttara Sector 7",
  },
  {
    clientName: "Sadia Islam",
    clientNameBn: "সাদিয়া ইসলাম",
    role: "Sold a flat in Mirpur",
    roleBn: "মিরপুরে ফ্ল্যাট বিক্রি করেছেন",
    quote:
      "They told me my asking price was about eight lakh too high and showed me the three sales they were comparing it to. It sold in eleven weeks at their number.",
    quoteBn:
      "বললেন আমার চাওয়া দাম আট লাখের মতো বেশি, আর যে তিনটি বিক্রির সঙ্গে মিলিয়েছেন সেগুলো দেখালেন। তাঁদের বলা দামেই এগারো সপ্তাহে বিক্রি হয়েছে।",
    rating: 5,
    propertyLabel: "Mirpur DOHS",
  },
  {
    clientName: "Kamrul Hasan",
    clientNameBn: "কামরুল হাসান",
    role: "Landlord",
    roleBn: "বাড়িওয়ালা",
    quote:
      "Two tenants in three years and no month without rent in between. They screen properly, which is the only part of this job I cannot do from abroad.",
    quoteBn:
      "তিন বছরে দুজন ভাড়াটে, মাঝে একটা মাসও ভাড়া বন্ধ থাকেনি। তারা ঠিকভাবে যাচাই করে — বিদেশ থেকে এই কাজটাই আমি করতে পারি না।",
    rating: 5,
    propertyLabel: "Baridhara Diplomatic Zone",
  },
  {
    clientName: "Mahmuda Akter",
    clientNameBn: "মাহমুদা আক্তার",
    role: "Bought in Mohammadpur",
    roleBn: "মোহাম্মদপুরে কিনেছেন",
    quote:
      "The flat I wanted was withdrawn by the owner a day before the deed. That was not their fault and they did not pretend otherwise — they had two alternatives ready by the evening.",
    quoteBn:
      "যে ফ্ল্যাটটি চেয়েছিলাম, দলিলের একদিন আগে মালিক তুলে নেন। এটি তাঁদের দোষ নয়, আর তাঁরা অন্য কিছু বলেননি — সন্ধ্যার মধ্যেই দুটি বিকল্প তৈরি ছিল।",
    rating: 4,
    propertyLabel: "Mohammadpur, Dhaka",
  },
  {
    clientName: "Arif Mahmud",
    clientNameBn: "আরিফ মাহমুদ",
    role: "NRB buyer, Dubai",
    roleBn: "প্রবাসী ক্রেতা, দুবাই",
    quote:
      "Everything went through the consular power of attorney without me flying back once. They knew which office needed which stamp, which I did not.",
    quoteBn:
      "একবারও দেশে না ফিরে কনস্যুলার আমমোক্তারনামা দিয়েই সব হয়েছে। কোন অফিসে কোন সিল লাগবে সেটা তাঁরা জানতেন, আমি জানতাম না।",
    rating: 5,
    propertyLabel: "Bashundhara Block C",
  },
  {
    clientName: "Rubaiya Noor",
    clientNameBn: "রুবাইয়া নূর",
    role: "Rented in Uttara",
    roleBn: "উত্তরায় ভাড়া নিয়েছেন",
    quote:
      "The photographs were taken the month I saw the listing, so the flat looked exactly as it had online. That sounds like a small thing until you have wasted six Fridays on viewings.",
    quoteBn:
      "লিস্টিং দেখার মাসেই ছবিগুলো তোলা, তাই ফ্ল্যাটটা অনলাইনে যেমন ছিল ঠিক তেমনই দেখলাম। ছোট ব্যাপার মনে হয় — যতক্ষণ না ছয়টা শুক্রবার দেখাদেখিতে নষ্ট হয়।",
    rating: 5,
    propertyLabel: "Uttara Sector 4",
  },
];

/** What `filmed: true` guarantees is present on the row. */
interface Filmed {
  youtubeUrl: string;
  duration: string;
}

const main = async () => {
  await mongoose.connect(config.db_url as string);

  // Stand-in faces and stills from what the library already holds.
  const images = await Media.find({ isDeleted: { $ne: true } })
    .select("_id")
    .sort({ createdAt: 1 })
    .limit(24)
    .lean();

  if (!images.length) {
    console.log("no media in the library — reviews will be seeded without photos");
  }

  const pick = (index: number) =>
    images.length ? images[index % images.length]._id : undefined;

  // Tie a quote to a real listing where the label matches one, so the card can
  // link through instead of naming a property the site does not have.
  const properties = await Property.find({ isDeleted: { $ne: true } })
    .select("_id title")
    .lean();

  const propertyFor = (label: string) => {
    const first = label.split(",")[0].trim().toLowerCase();
    return properties.find((p) =>
      (p.title || "").toLowerCase().includes(first),
    )?._id;
  };

  let created = 0;
  let kept = 0;
  let index = 0;

  const rows = [
    ...VIDEO_REVIEWS.map((r, i) => ({ ...r, filmed: true, position: i })),
    ...TEXT_REVIEWS.map((r, i) => ({
      ...r,
      filmed: false,
      position: VIDEO_REVIEWS.length + i,
    })),
  ];

  for (const row of rows) {
    const existing = await Review.findOne({
      clientName: row.clientName,
      quote: row.quote,
    }).lean();

    if (existing) {
      kept += 1;
      index += 1;
      continue;
    }

    const photo = pick(index);
    const poster = pick(index + 7);

    await Review.create({
      clientName: row.clientName,
      clientNameBn: row.clientNameBn,
      role: row.role,
      roleBn: row.roleBn,
      quote: row.quote,
      quoteBn: row.quoteBn,
      rating: row.rating,
      photo,
      property: propertyFor(row.propertyLabel),
      propertyLabel: row.propertyLabel,
      ...(row.filmed
        ? {
            video: {
              youtubeUrl: (row as unknown as Filmed).youtubeUrl,
              poster,
              duration: (row as unknown as Filmed).duration,
            },
          }
        : {}),
      isPublished: true,
      // The filmed ones carry the home strip: it is a row of players, and a
      // written quote has nothing to play there.
      featured: row.filmed,
      isHome: row.filmed,
      order: row.position,
    });

    created += 1;
    index += 1;
  }

  console.log(
    `reviews: ${created} created, ${kept} already present ` +
      `(${VIDEO_REVIEWS.length} filmed, ${TEXT_REVIEWS.length} written)`,
  );

  await mongoose.disconnect();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
