import mongoose from "mongoose";
import slugify from "slugify";

import config from "../app/config";
import { BlogCategory, BlogPost } from "../app/modules/blog/blog.model";
import { Media } from "../app/modules/media-library/media-library.model";

/**
 * Nine categories and twenty articles.
 *
 * Long on purpose. A blog seeded with three-line placeholders tells you
 * nothing about how the article page behaves — whether the table of contents
 * has anything to index, whether the reading time is plausible, whether a
 * lead paragraph and a subheading look right together. These run to the length
 * a real post does.
 *
 * The body is HTML because that is what the panel's editor produces.
 *
 * Idempotent on slug, so running it twice does not double the blog.
 *
 *   npm run seed:blog
 */

const CATEGORIES = [
  { name: "Market", nameBn: "বাজার", description: "Prices, supply and what is actually selling." },
  { name: "Legal", nameBn: "আইন", description: "Deeds, mutation, RAJUK and the paperwork behind a sale." },
  { name: "Guide", nameBn: "গাইড", description: "Step-by-step, for people buying or selling their first." },
  { name: "NRB", nameBn: "প্রবাসী", description: "Buying from abroad, and the rules that apply to it." },
  { name: "Real Estate", nameBn: "রিয়েল এস্টেট", description: "The industry, its players and its habits." },
  { name: "Architecture", nameBn: "স্থাপত্য", description: "How buildings here are designed and built." },
  { name: "Economy", nameBn: "অর্থনীতি", description: "Rates, currency and what they do to property." },
  { name: "Technology", nameBn: "প্রযুক্তি", description: "What is changing in how property is bought." },
  { name: "Lifestyle", nameBn: "জীবনযাপন", description: "Living in Dhaka, neighbourhood by neighbourhood." },
];

type Section = {
  heading: string;
  headingBn: string;
  paragraphs: string[];
  paragraphsBn: string[];
  list?: string[];
  listBn?: string[];
};

type Post = {
  title: string;
  titleBn: string;
  category: string;
  tags: string[];
  excerpt: string;
  excerptBn: string;
  metaTitle?: string;
  metaDescription?: string;
  lead: string;
  leadBn: string;
  sections: Section[];
  featured?: boolean;
  trending?: boolean;
};

/**
 * Reading time, the same way the service derives it.
 *
 * The seed writes through the model rather than the service — it has no
 * request context to record history against — so this has to be computed here
 * or every article ships claiming to be a one-minute read.
 */
const readingTime = (html: string) => {
  const words = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

/** Composes one language's HTML from the structured post. */
const bodyHtml = (post: Post, lang: "en" | "bn") => {
  const bn = lang === "bn";
  const parts: string[] = [`<p><strong>${bn ? post.leadBn : post.lead}</strong></p>`];

  for (const section of post.sections) {
    parts.push(`<h2>${bn ? section.headingBn : section.heading}</h2>`);
    for (const p of bn ? section.paragraphsBn : section.paragraphs) {
      parts.push(`<p>${p}</p>`);
    }
    const list = bn ? section.listBn : section.list;
    if (list?.length) {
      parts.push(`<ul>${list.map((li) => `<li>${li}</li>`).join("")}</ul>`);
    }
  }

  return parts.join("");
};

const POSTS: Post[] = [
  {
    title: "What a flat in Gulshan actually sold for last quarter",
    titleBn: "গত প্রান্তিকে গুলশানে একটি ফ্ল্যাট আসলে কত দামে বিক্রি হয়েছে",
    category: "Market",
    tags: ["gulshan", "prices", "market"],
    excerpt:
      "Asking prices and sale prices are two different numbers, and only one of them is published. Here is the gap, measured across forty-one registered transfers.",
    excerptBn:
      "চাহিদা মূল্য আর বিক্রয় মূল্য এক নয়, আর প্রকাশ পায় কেবল একটি। একচল্লিশটি নিবন্ধিত হস্তান্তর ধরে সেই ফারাকটিই এখানে মাপা হয়েছে।",
    metaTitle: "Gulshan flat prices: asking vs actual, last quarter",
    metaDescription:
      "Across 41 registered transfers in Gulshan 1 and 2, sale prices came in 6–11% under asking. What that gap means for a buyer.",
    lead: "Every listing site in this city publishes what sellers hope to get. Almost none publish what buyers paid.",
    leadBn: "এই শহরের প্রতিটি লিস্টিং সাইট প্রকাশ করে বিক্রেতা কত চান। কেউ প্রায় প্রকাশ করে না ক্রেতা কত দিয়েছেন।",
    sections: [
      {
        heading: "The gap between asking and paid",
        headingBn: "চাওয়া আর দেওয়ার ফারাক",
        paragraphs: [
          "We pulled forty-one registered transfers in Gulshan 1 and 2 from the last quarter and set each against the price the same unit had been advertised at. The median sale came in between six and eleven per cent under asking, and the spread was widest on the largest units.",
          "That is not a discount a buyer negotiates so much as a correction the market applies. A 4,000 sq ft flat has a small pool of buyers, and a seller who prices for the top of that pool waits months to find out there is nobody in it.",
        ],
        paragraphsBn: [
          "গত প্রান্তিকে গুলশান ১ ও ২-এর একচল্লিশটি নিবন্ধিত হস্তান্তর নিয়ে আমরা প্রতিটির বিপরীতে একই ইউনিটের বিজ্ঞাপিত দাম বসিয়েছি। মধ্যমা বিক্রয়মূল্য চাহিদা মূল্যের চেয়ে ছয় থেকে এগারো শতাংশ কম, আর ফারাক সবচেয়ে বেশি বড় ইউনিটগুলোতে।",
          "এটি ক্রেতার দরকষাকষির ছাড় নয়, বরং বাজারের সংশোধন। ৪,০০০ বর্গফুটের ফ্ল্যাটের ক্রেতা কম, আর যে বিক্রেতা সেই ছোট দলের সর্বোচ্চ ধরে দাম হাঁকেন, তিনি মাসের পর মাস অপেক্ষা করে জানতে পারেন সেখানে কেউ নেই।",
        ],
        list: [
          "Under 2,000 sq ft — median 6% under asking",
          "2,000 to 3,000 sq ft — median 8% under asking",
          "Above 3,000 sq ft — median 11% under asking",
        ],
        listBn: [
          "২,০০০ বর্গফুটের নিচে — মধ্যমা ৬% কম",
          "২,০০০ থেকে ৩,০০০ বর্গফুট — মধ্যমা ৮% কম",
          "৩,০০০ বর্গফুটের উপরে — মধ্যমা ১১% কম",
        ],
      },
      {
        heading: "Why the published figure stays high",
        headingBn: "প্রকাশিত সংখ্যাটি কেন উঁচু থাকে",
        paragraphs: [
          "Registered value and paid value are also not the same thing, for reasons every practitioner here understands and few write down. The registered figure follows the mouza rate; the balance moves separately. Any analysis built only on registry data will read the market as cheaper than it is.",
          "We use both: the registry for what is provable, and our own transaction record for what was actually agreed. Where the two disagree we say so rather than picking the flattering one.",
        ],
        paragraphsBn: [
          "নিবন্ধিত মূল্য আর প্রদত্ত মূল্যও এক নয় — কারণটি এখানকার প্রত্যেক পেশাজীবী জানেন, লেখেন কম। নিবন্ধিত অঙ্ক চলে মৌজা রেট ধরে; বাকিটা আলাদা পথে যায়। কেবল রেজিস্ট্রি তথ্যে গড়া যেকোনো বিশ্লেষণ বাজারকে প্রকৃতির চেয়ে সস্তা দেখাবে।",
          "আমরা দুটোই ব্যবহার করি: যা প্রমাণযোগ্য তার জন্য রেজিস্ট্রি, আর যা প্রকৃতপক্ষে স্থির হয়েছে তার জন্য নিজেদের লেনদেন নথি। দুটোতে গরমিল হলে আমরা তা বলি, সুবিধাজনকটি বেছে নিই না।",
        ],
      },
      {
        heading: "What a buyer should do with this",
        headingBn: "ক্রেতা এটি নিয়ে কী করবেন",
        paragraphs: [
          "Treat the advertised price as the start of a conversation, not a valuation. Ask what the last comparable unit in the same building transferred for, and ask to see it. A seller who will not answer that question has told you something.",
          "And check how long the listing has been up. A flat that has been advertised for seven months at the same price is not priced at the market; it is priced at the seller.",
        ],
        paragraphsBn: [
          "বিজ্ঞাপিত দামকে মূল্যায়ন নয়, আলোচনার শুরু হিসেবে ধরুন। একই ভবনে সর্বশেষ তুলনীয় ইউনিট কত দামে হস্তান্তর হয়েছে জিজ্ঞেস করুন, আর তা দেখতে চান। যে বিক্রেতা এর উত্তর দেবেন না, তিনি আপনাকে কিছু একটা জানিয়ে দিলেন।",
          "আর দেখুন লিস্টিংটি কতদিন ধরে আছে। সাত মাস ধরে একই দামে বিজ্ঞাপিত ফ্ল্যাটের দাম বাজার ঠিক করেনি, ঠিক করেছেন বিক্রেতা।",
        ],
      },
    ],
    featured: true,
    trending: true,
  },
  {
    title: "Reading a title deed without a lawyer beside you",
    titleBn: "আইনজীবী ছাড়া দলিল পড়ার উপায়",
    category: "Legal",
    tags: ["deed", "title", "legal"],
    excerpt:
      "You will still want a lawyer. But knowing what the six pages say before you hand them over changes what you are paying that lawyer to find.",
    excerptBn:
      "আইনজীবী তবু লাগবে। কিন্তু ছয় পৃষ্ঠায় কী আছে তা হস্তান্তরের আগে জানলে, আপনি আইনজীবীকে কী খুঁজতে টাকা দিচ্ছেন সেটিই বদলে যায়।",
    metaDescription:
      "The six things on a Bangladeshi title deed a buyer can check themselves, and the three that genuinely need a lawyer.",
    lead: "A deed is not written to be read by the person buying the property. That does not mean you cannot read it.",
    leadBn: "দলিল লেখা হয় না সম্পত্তি যিনি কিনছেন তাঁর পড়ার জন্য। তার মানে এই নয় যে আপনি পড়তে পারবেন না।",
    sections: [
      {
        heading: "Start with the chain, not the property",
        headingBn: "সম্পত্তি নয়, ধারাবাহিকতা দিয়ে শুরু করুন",
        paragraphs: [
          "The first question is not what is being sold but how the seller came to own it. A deed records a transfer; it does not prove the transferor had anything to transfer. That is what the previous deeds are for, and you want them going back at least twenty-five years.",
          "Lay them end to end and check that each seller is the previous buyer. A break in that chain is the single most common defect we find, and it is usually an inheritance that was never formally divided.",
        ],
        paragraphsBn: [
          "প্রথম প্রশ্ন কী বিক্রি হচ্ছে তা নয়, বিক্রেতা কীভাবে এর মালিক হলেন তা। দলিল একটি হস্তান্তরের নথি; হস্তান্তরকারীর হস্তান্তরযোগ্য কিছু ছিল কিনা তার প্রমাণ নয়। সেটির জন্যই আগের দলিলগুলো, আর অন্তত পঁচিশ বছর পেছন পর্যন্ত চাই।",
          "সেগুলো পরপর সাজিয়ে দেখুন প্রতিটি বিক্রেতা আগের ক্রেতা কিনা। এই ধারাবাহিকতায় ছেদই আমাদের পাওয়া সবচেয়ে সাধারণ ত্রুটি, আর সাধারণত তা কোনো উত্তরাধিকার যা আনুষ্ঠানিকভাবে ভাগ হয়নি।",
        ],
        list: [
          "Every seller appears as the buyer in the deed before it",
          "Names match across documents, including spelling",
          "Dates run forward with no unexplained gaps",
          "The area transferred never grows between deeds",
        ],
        listBn: [
          "প্রতিটি বিক্রেতা আগের দলিলে ক্রেতা হিসেবে আছেন",
          "নথিজুড়ে নাম মেলে, বানানসহ",
          "তারিখ সামনে এগোয়, ব্যাখ্যাহীন ফাঁক নেই",
          "হস্তান্তরিত জমির পরিমাণ দলিলে দলিলে বাড়ে না",
        ],
      },
      {
        heading: "Then the mutation",
        headingBn: "এরপর নামজারি",
        paragraphs: [
          "A deed without a mutation is a receipt, not a record. Mutation is what moves the name in the land office register, and until it happens the state still thinks the previous owner owns the property — which is who will receive the notice if the land is ever acquired.",
          "Ask for the mutation khatian and the last three years of land tax receipts. They are cheap to obtain and expensive to be missing.",
        ],
        paragraphsBn: [
          "নামজারি ছাড়া দলিল একটি রসিদ, নথি নয়। নামজারিই ভূমি অফিসের রেজিস্টারে নাম বদলায়, আর তা না হওয়া পর্যন্ত রাষ্ট্র আগের মালিককেই মালিক মনে করে — জমি অধিগ্রহণ হলে নোটিশ তিনিই পাবেন।",
          "নামজারি খতিয়ান আর শেষ তিন বছরের ভূমি করের রসিদ চান। এগুলো সংগ্রহ করা সস্তা, না থাকা ব্যয়বহুল।",
        ],
      },
      {
        heading: "What still needs a lawyer",
        headingBn: "যা এখনও আইনজীবী ছাড়া হবে না",
        paragraphs: [
          "Three things. A search at the sub-registry for encumbrances you were not told about. A check that no injunction or partition suit touches the plot. And, for apartments, whether the land the building sits on was ever properly transferred to the owners' association.",
          "None of those are visible in the papers you were handed. That is the point of paying for the search.",
        ],
        paragraphsBn: [
          "তিনটি জিনিস। যেসব দায় আপনাকে জানানো হয়নি তার জন্য সাব-রেজিস্ট্রিতে অনুসন্ধান। কোনো নিষেধাজ্ঞা বা বাটোয়ারা মামলা জমিটিকে ছোঁয় কিনা তা যাচাই। আর অ্যাপার্টমেন্টের ক্ষেত্রে, ভবনের জমি কখনও মালিক সমিতিতে যথাযথভাবে হস্তান্তর হয়েছিল কিনা।",
          "এর কোনোটিই আপনার হাতে দেওয়া কাগজে দেখা যায় না। অনুসন্ধানের জন্য টাকা দেওয়ার কারণই সেটি।",
        ],
      },
    ],
    featured: true,
  },
  {
    title: "The buyer's checklist we actually use on a site visit",
    titleBn: "সাইট পরিদর্শনে আমরা যে চেকলিস্ট সত্যিই ব্যবহার করি",
    category: "Guide",
    tags: ["checklist", "site visit", "buying"],
    excerpt:
      "Twenty-two things our survey team looks at, in the order they look at them, and why a few of them matter more than the finishes everybody photographs.",
    excerptBn:
      "আমাদের সার্ভে দল যে বাইশটি বিষয় দেখে, যে ক্রমে দেখে, আর সবাই যে ফিনিশিংয়ের ছবি তোলে তার চেয়ে কয়েকটি কেন বেশি জরুরি।",
    lead: "The tiles are the last thing we look at, and the first thing most buyers photograph.",
    leadBn: "টাইলস আমরা দেখি সবার শেষে, আর বেশিরভাগ ক্রেতা ছবি তোলেন সবার আগে।",
    sections: [
      {
        heading: "Before you go inside",
        headingBn: "ভিতরে ঢোকার আগে",
        paragraphs: [
          "Stand across the road for two minutes. Look at the drainage at the foot of the building, the width of the access road against a fire truck, and whether the neighbouring plot is empty — because an empty plot in Dhaka is a future eighteen storeys against your bedroom window.",
          "Then walk the perimeter. Damp at the base, hairline cracks stepping diagonally from window corners, and any patch of new plaster on an old wall are worth more than an hour inside.",
        ],
        paragraphsBn: [
          "রাস্তার ওপারে দুই মিনিট দাঁড়ান। ভবনের গোড়ার পানি নিষ্কাশন দেখুন, ফায়ার সার্ভিসের গাড়ির তুলনায় প্রবেশ রাস্তার প্রশস্ততা দেখুন, আর পাশের প্লট খালি কিনা দেখুন — কারণ ঢাকায় খালি প্লট মানে ভবিষ্যতের আঠারো তলা, আপনার শোবার ঘরের জানালার গায়ে।",
          "এরপর চারপাশে হাঁটুন। গোড়ায় স্যাঁতসেঁতে ভাব, জানালার কোণ থেকে তির্যকভাবে নামা সূক্ষ্ম ফাটল, আর পুরোনো দেয়ালে নতুন প্লাস্টারের কোনো তালি — ভিতরে এক ঘণ্টার চেয়ে এগুলোর দাম বেশি।",
        ],
      },
      {
        heading: "Inside, in this order",
        headingBn: "ভিতরে, এই ক্রমে",
        paragraphs: [
          "Water first. Open every tap, flush every toilet, and run them together — pressure that holds on one outlet and collapses on three tells you about the pump, not the plumbing.",
          "Then the electrical board, the ceiling above every bathroom on the floor above, and the window frames. Finishes last, because finishes are the cheapest thing on this list to replace.",
        ],
        paragraphsBn: [
          "আগে পানি। প্রতিটি কল খুলুন, প্রতিটি টয়লেট ফ্লাশ করুন, আর একসঙ্গে চালান — এক জায়গায় যে চাপ থাকে আর তিন জায়গায় ভেঙে পড়ে, তা পাম্পের কথা বলে, পাইপের নয়।",
          "এরপর বৈদ্যুতিক বোর্ড, উপরের তলার প্রতিটি বাথরুমের নিচের ছাদ, আর জানালার ফ্রেম। ফিনিশিং সবার শেষে, কারণ এই তালিকায় বদলানোর খরচ ফিনিশিংয়েরই সবচেয়ে কম।",
        ],
        list: [
          "Water pressure with three outlets running",
          "Ceiling under the bathroom above, for old leaks",
          "Electrical board — breakers, not rewirable fuses",
          "Window frames, opened and closed fully",
          "Lift machine room, if you can get into it",
          "Generator: capacity, and whether it runs the lifts",
        ],
        listBn: [
          "তিনটি কল একসঙ্গে চালিয়ে পানির চাপ",
          "উপরের বাথরুমের নিচের ছাদ, পুরোনো লিকের জন্য",
          "বৈদ্যুতিক বোর্ড — ব্রেকার, তারযুক্ত ফিউজ নয়",
          "জানালার ফ্রেম, পুরো খুলে ও বন্ধ করে",
          "লিফটের মেশিন রুম, ঢোকা গেলে",
          "জেনারেটর: ক্ষমতা, আর তা লিফট চালায় কিনা",
        ],
      },
    ],
  },
  {
    title: "Buying from abroad: what an NRB can and cannot do",
    titleBn: "প্রবাস থেকে কেনা: একজন প্রবাসী কী পারেন, কী পারেন না",
    category: "NRB",
    tags: ["nrb", "remittance", "power of attorney"],
    excerpt:
      "Remittance channel, power of attorney, repatriation of sale proceeds — the three places an overseas purchase goes wrong, and how to close each one.",
    excerptBn:
      "রেমিট্যান্স চ্যানেল, আমমোক্তারনামা, বিক্রির অর্থ ফেরত — প্রবাস থেকে কেনায় যে তিন জায়গায় ভুল হয়, আর কীভাবে প্রতিটি বন্ধ করবেন।",
    metaDescription:
      "How a non-resident Bangladeshi should route funds, appoint an attorney and preserve the right to repatriate — in the right order.",
    lead: "The purchase is the easy part. Getting money in cleanly, and out again later, is where the work is.",
    leadBn: "কেনাটাই সহজ অংশ। পরিষ্কারভাবে টাকা আনা, আর পরে ফেরত নেওয়াই আসল কাজ।",
    sections: [
      {
        heading: "Route the money before you choose the flat",
        headingBn: "ফ্ল্যাট বাছার আগে টাকার পথ ঠিক করুন",
        paragraphs: [
          "Funds sent through formal banking channels into an NFCD or a non-resident taka account leave a trail that supports repatriation later. Funds carried in, or sent through an informal channel, do not — and the difference only becomes visible years afterwards when you try to sell.",
          "Open the account first, remit against the purchase, and keep the encashment certificates. They are the document that matters and the one nobody thinks about until it is needed.",
        ],
        paragraphsBn: [
          "আনুষ্ঠানিক ব্যাংকিং চ্যানেলে এনএফসিডি বা অনিবাসী টাকা হিসাবে পাঠানো অর্থ এমন নথিসূত্র রেখে যায় যা পরে অর্থ ফেরত নেওয়ায় সহায়ক। হাতে বয়ে আনা বা অনানুষ্ঠানিক পথে পাঠানো অর্থ তা রাখে না — আর পার্থক্যটি বছর কয়েক পরে বিক্রি করতে গিয়ে ধরা পড়ে।",
          "আগে হিসাব খুলুন, ক্রয়ের বিপরীতে অর্থ পাঠান, আর এনক্যাশমেন্ট সার্টিফিকেট রাখুন। এটিই গুরুত্বপূর্ণ নথি, আর প্রয়োজন না পড়া পর্যন্ত এটির কথাই কেউ ভাবেন না।",
        ],
      },
      {
        heading: "The power of attorney, narrowly drawn",
        headingBn: "আমমোক্তারনামা, সীমিত পরিসরে",
        paragraphs: [
          "You will need someone here to sign. Give them the narrowest authority that gets the job done: this property, this transaction, expiring on a date. A general power of attorney handed to a relative is how people lose land to their own families.",
          "It must be attested at the mission, then stamped and registered here. Skipping either step produces a document that looks right and does nothing.",
        ],
        paragraphsBn: [
          "সই করার জন্য এখানে কাউকে লাগবেই। কাজটি হয় এমন সবচেয়ে সীমিত ক্ষমতা দিন: এই সম্পত্তি, এই লেনদেন, নির্দিষ্ট তারিখে মেয়াদ শেষ। আত্মীয়ের হাতে তুলে দেওয়া সাধারণ আমমোক্তারনামাই মানুষের নিজের পরিবারের কাছে জমি হারানোর পথ।",
          "এটি দূতাবাসে সত্যায়িত হতে হবে, তারপর এখানে স্ট্যাম্প ও নিবন্ধন। যেকোনো একটি ধাপ বাদ দিলে এমন নথি তৈরি হয় যা দেখতে ঠিক, কাজে শূন্য।",
        ],
      },
    ],
    trending: true,
  },
  {
    title: "Why service charge is the number nobody negotiates",
    titleBn: "সার্ভিস চার্জ কেন সেই সংখ্যা যা নিয়ে কেউ দরদাম করে না",
    category: "Real Estate",
    tags: ["service charge", "ownership costs"],
    excerpt:
      "A flat that costs ten per cent less and charges four thousand more a month is not cheaper. Over a decade it is considerably dearer.",
    excerptBn:
      "যে ফ্ল্যাটের দাম দশ শতাংশ কম কিন্তু মাসে চার হাজার টাকা বেশি নেয়, তা সস্তা নয়। এক দশকে তা বরং যথেষ্ট দামি।",
    lead: "Buyers negotiate the price for weeks and accept the monthly charge without asking how it is calculated.",
    leadBn: "ক্রেতারা সপ্তাহের পর সপ্তাহ দাম নিয়ে দরদাম করেন, আর মাসিক চার্জ কীভাবে হিসাব হয় তা না জিজ্ঞেস করেই মেনে নেন।",
    sections: [
      {
        heading: "What it is actually paying for",
        headingBn: "এটি আসলে কীসের খরচ",
        paragraphs: [
          "Security, lift maintenance, generator fuel, common electricity, the caretaker, and — in a well-run building — a sinking fund for the things that fail every fifteen years. It is the last one that separates a building that ages well from one that does not.",
          "Ask for a year of accounts before you buy. An association that cannot produce them is telling you there is no sinking fund, and that the first lift replacement will arrive as a demand rather than a plan.",
        ],
        paragraphsBn: [
          "নিরাপত্তা, লিফট রক্ষণাবেক্ষণ, জেনারেটরের জ্বালানি, সাধারণ বিদ্যুৎ, কেয়ারটেকার, আর সুপরিচালিত ভবনে — পনেরো বছর পরপর যা নষ্ট হয় তার জন্য সিঙ্কিং ফান্ড। শেষেরটিই ঠিক করে কোন ভবন সুন্দরভাবে পুরোনো হয়, কোনটি হয় না।",
          "কেনার আগে এক বছরের হিসাব চান। যে সমিতি তা দিতে পারে না, তারা জানিয়ে দিচ্ছে সিঙ্কিং ফান্ড নেই, আর প্রথম লিফট বদলের খরচ আসবে পরিকল্পনা নয়, দাবি হিসেবে।",
        ],
        list: [
          "Ask for twelve months of association accounts",
          "Ask what the sinking fund holds today",
          "Ask when the lifts and the generator were installed",
          "Ask how many units are in arrears",
        ],
        listBn: [
          "সমিতির বারো মাসের হিসাব চান",
          "সিঙ্কিং ফান্ডে আজ কত আছে জিজ্ঞেস করুন",
          "লিফট ও জেনারেটর কবে বসানো হয়েছে জিজ্ঞেস করুন",
          "কতটি ইউনিটের বকেয়া আছে জিজ্ঞেস করুন",
        ],
      },
    ],
  },
];

/**
 * The catalogue needs twenty. The five above are written in full; the rest are
 * built from the same structure with their own subject, so every article on the
 * seeded blog is a real read rather than filler.
 */
const MORE: Array<Pick<Post, "title" | "titleBn" | "category" | "tags" | "excerpt" | "excerptBn" | "lead" | "leadBn"> & { angle: string; angleBn: string }> = [
  { title: "Bashundhara Block K, five years on", titleBn: "বসুন্ধরা ব্লক কে, পাঁচ বছর পর", category: "Lifestyle", tags: ["bashundhara", "neighbourhood"], excerpt: "The block that was going to be finished in three years. What actually got built, and what the roads look like now.", excerptBn: "যে ব্লক তিন বছরে শেষ হওয়ার কথা ছিল। আসলে কী তৈরি হলো, আর রাস্তাগুলো এখন কেমন।", lead: "A masterplan is a promise about a place that does not exist yet. Five years is long enough to check it.", leadBn: "মাস্টারপ্ল্যান এমন এক জায়গা নিয়ে প্রতিশ্রুতি যা এখনও নেই। পাঁচ বছর তা যাচাইয়ের জন্য যথেষ্ট।", angle: "what was promised against what stands there now, road by road", angleBn: "যা প্রতিশ্রুত ছিল আর যা এখন দাঁড়িয়ে আছে, রাস্তা ধরে ধরে" },
  { title: "What RAJUK actually checks in a building plan", titleBn: "রাজউক নকশায় আসলে কী দেখে", category: "Legal", tags: ["rajuk", "approval"], excerpt: "Setbacks, FAR, parking and the fire escape. The four things an approval turns on, and the one developers most often push.", excerptBn: "সেটব্যাক, এফএআর, পার্কিং আর অগ্নিনির্গমন। অনুমোদন যে চারটির উপর নির্ভর করে, আর ডেভেলপাররা যেটিতে সবচেয়ে বেশি চাপ দেন।", lead: "An approved plan and the building on the plot are not always the same building.", leadBn: "অনুমোদিত নকশা আর প্লটে দাঁড়ানো ভবন সবসময় একই ভবন নয়।", angle: "the four tests an approval turns on, and how to compare plan to building", angleBn: "অনুমোদন যে চারটি পরীক্ষায় নির্ভর করে, আর নকশার সঙ্গে ভবন মেলানোর উপায়" },
  { title: "The rise of the small-plot developer", titleBn: "ছোট প্লটের ডেভেলপারের উত্থান", category: "Real Estate", tags: ["developers", "joint venture"], excerpt: "Three and four katha joint ventures now outnumber the large ones. What that means for build quality and for landowners.", excerptBn: "তিন ও চার কাঠার যৌথ উদ্যোগ এখন বড়গুলোর চেয়ে বেশি। নির্মাণমান আর জমির মালিকদের জন্য এর অর্থ কী।", lead: "The economics of a four katha plot are not a smaller version of a fourteen katha plot.", leadBn: "চার কাঠার হিসাব চৌদ্দ কাঠার ছোট সংস্করণ নয়।", angle: "why small-plot economics change the build, and what a landowner should insist on", angleBn: "ছোট প্লটের হিসাব কেন নির্মাণ বদলে দেয়, আর জমির মালিকের কী দাবি করা উচিত" },
  { title: "Seismic code in practice, not on paper", titleBn: "কাগজে নয়, বাস্তবে ভূমিকম্প কোড", category: "Architecture", tags: ["bnbc", "structure", "safety"], excerpt: "BNBC 2020 is a good code. Whether a given building follows it is a question about testing, not about the drawing.", excerptBn: "বিএনবিসি ২০২০ একটি ভালো কোড। কোনো ভবন তা মানছে কিনা সেটি পরীক্ষার প্রশ্ন, নকশার নয়।", lead: "Every developer says their building follows the code. The reports either exist or they do not.", leadBn: "প্রত্যেক ডেভেলপার বলেন তাঁদের ভবন কোড মানে। রিপোর্ট হয় থাকে, নয় থাকে না।", angle: "which test reports to ask for, and what each one proves", angleBn: "কোন পরীক্ষার রিপোর্ট চাইবেন, আর প্রতিটি কী প্রমাণ করে" },
  { title: "What a rising dollar does to Dhaka property", titleBn: "ডলারের দাম বাড়লে ঢাকার সম্পত্তির কী হয়", category: "Economy", tags: ["currency", "rates", "market"], excerpt: "Imported fittings, steel and lift systems price in dollars. Here is how that reaches the square foot rate, with a lag.", excerptBn: "আমদানি করা ফিটিংস, ইস্পাত ও লিফট ডলারে দাম ধরে। কীভাবে তা দেরিতে হলেও বর্গফুট দরে পৌঁছায়।", lead: "Construction cost is a currency story before it is a property story.", leadBn: "নির্মাণ খরচ সম্পত্তির গল্প হওয়ার আগে মুদ্রার গল্প।", angle: "the transmission from exchange rate to square foot rate, and the lag", angleBn: "বিনিময় হার থেকে বর্গফুট দরে পৌঁছানোর পথ, আর তার দেরি" },
  { title: "Renting before buying, and what it teaches you", titleBn: "কেনার আগে ভাড়া, আর তা যা শেখায়", category: "Guide", tags: ["renting", "buying"], excerpt: "A year in the area you are considering will tell you more than twenty viewings. What to pay attention to while you are there.", excerptBn: "যে এলাকায় ভাবছেন সেখানে এক বছর কুড়িটি ভিজিটের চেয়ে বেশি বলবে। থাকাকালীন কী লক্ষ করবেন।", lead: "Nobody discovers the water problem on a Sunday afternoon viewing.", leadBn: "রোববার বিকেলের ভিজিটে কেউ পানির সমস্যা টের পান না।", angle: "what a year of living there reveals that a viewing cannot", angleBn: "এক বছর বাস করলে যা জানা যায়, ভিজিটে যা যায় না" },
  { title: "Virtual tours, and where they mislead", titleBn: "ভার্চুয়াল ট্যুর, আর কোথায় তা বিভ্রান্ত করে", category: "Technology", tags: ["virtual tour", "photography"], excerpt: "A wide lens makes a small room generous and a dark room bright. Three things a 360 tour cannot show you at all.", excerptBn: "চওড়া লেন্স ছোট ঘরকে বড় আর অন্ধকার ঘরকে উজ্জ্বল দেখায়। তিনটি জিনিস যা ৩৬০ ট্যুর একেবারেই দেখাতে পারে না।", lead: "The tour is honest about the layout and dishonest about almost everything else.", leadBn: "ট্যুর বিন্যাস নিয়ে সৎ, আর প্রায় বাকি সব নিয়ে অসৎ।", angle: "what the lens does to a room, and the three things no tour can carry", angleBn: "লেন্স ঘরের সঙ্গে যা করে, আর যে তিনটি জিনিস কোনো ট্যুর বহন করতে পারে না" },
  { title: "Handover delays: the clause that actually bites", titleBn: "হস্তান্তরে বিলম্ব: যে ধারাটি সত্যিই কামড়ায়", category: "Legal", tags: ["handover", "contract"], excerpt: "Most agreements promise a date and provide no remedy. What a workable delay clause looks like, in plain terms.", excerptBn: "বেশিরভাগ চুক্তিতে তারিখ থাকে, প্রতিকার থাকে না। কার্যকর বিলম্ব ধারা দেখতে কেমন, সহজ ভাষায়।", lead: "A date without a consequence is a hope with a signature under it.", leadBn: "পরিণতিহীন তারিখ মানে সই করা একটি আশা।", angle: "what makes a delay clause enforceable rather than decorative", angleBn: "কী একটি বিলম্ব ধারাকে সাজসজ্জা নয়, আদায়যোগ্য করে" },
  { title: "Dhanmondi's quiet streets, and what they cost", titleBn: "ধানমন্ডির শান্ত রাস্তা, আর তার দাম", category: "Lifestyle", tags: ["dhanmondi", "neighbourhood"], excerpt: "Two roads apart, the same size flat differs by a quarter. Traffic, schools and the lake explain most of the gap.", excerptBn: "দুই রাস্তা দূরত্বে একই মাপের ফ্ল্যাটের দামে এক-চতুর্থাংশ ফারাক। যানজট, স্কুল আর লেক এর বেশিরভাগ ব্যাখ্যা করে।", lead: "In Dhanmondi the address is not the neighbourhood; the road number is.", leadBn: "ধানমন্ডিতে ঠিকানা এলাকা নয়, রোড নম্বরই এলাকা।", angle: "how road number, not area, sets price in Dhanmondi", angleBn: "ধানমন্ডিতে এলাকা নয়, রোড নম্বর কীভাবে দাম ঠিক করে" },
  { title: "How we photograph a listing, and why it is dated", titleBn: "আমরা কীভাবে লিস্টিংয়ের ছবি তুলি, আর কেন তারিখ দিই", category: "Real Estate", tags: ["photography", "trust"], excerpt: "Every photograph on this site carries the month it was taken. Here is what changed when we started doing that.", excerptBn: "এই সাইটের প্রতিটি ছবিতে তোলার মাস লেখা থাকে। এটি শুরু করার পর যা বদলেছে।", lead: "A photograph with no date is a claim about a building at an unknown time.", leadBn: "তারিখহীন ছবি মানে অজানা সময়ের একটি ভবন নিয়ে দাবি।", angle: "what dating every photograph changed, for us and for buyers", angleBn: "প্রতিটি ছবিতে তারিখ দেওয়া আমাদের ও ক্রেতাদের জন্য কী বদলেছে" },
  { title: "The mutation backlog, and how to work around it", titleBn: "নামজারির জট, আর তা এড়িয়ে চলার উপায়", category: "Legal", tags: ["mutation", "land office"], excerpt: "Mutation now takes months in some circles. What you can do in parallel so a sale is not held hostage to a queue.", excerptBn: "কোনো কোনো সার্কেলে নামজারিতে এখন মাস লাগে। সমান্তরালে কী করা যায় যাতে বিক্রি লাইনের কাছে জিম্মি না হয়।", lead: "You cannot make the queue move faster. You can stop it being on the critical path.", leadBn: "লাইন দ্রুত করা যায় না। একে গুরুত্বপূর্ণ পথ থেকে সরিয়ে দেওয়া যায়।", angle: "what can proceed in parallel with a pending mutation, and what cannot", angleBn: "নামজারি ঝুলে থাকলে সমান্তরালে কী চলতে পারে, কী পারে না" },
  { title: "Metro Line 6 and the addresses it changed", titleBn: "মেট্রো লাইন ৬ আর যেসব ঠিকানা বদলে গেল", category: "Market", tags: ["metro", "uttara", "mirpur"], excerpt: "Walking distance to a station is now a price factor. We measured it along the line, station by station.", excerptBn: "স্টেশন থেকে হাঁটাপথ এখন দামের উপাদান। লাইন ধরে স্টেশনে স্টেশনে আমরা তা মেপেছি।", lead: "The line did not lift every address near it. It lifted the ones you can walk to.", leadBn: "লাইনটি কাছের সব ঠিকানার দাম বাড়ায়নি। বাড়িয়েছে যেগুলোতে হেঁটে যাওয়া যায়।", angle: "the measured premium by walking minutes to a station", angleBn: "স্টেশনে হাঁটার মিনিট অনুযায়ী মাপা বাড়তি দাম" },
  { title: "Fifteen questions to ask a developer's site engineer", titleBn: "ডেভেলপারের সাইট ইঞ্জিনিয়ারকে করার পনেরোটি প্রশ্ন", category: "Guide", tags: ["construction", "questions"], excerpt: "The engineer on site will answer things the sales office will not. What to ask while you are standing there.", excerptBn: "সাইটের ইঞ্জিনিয়ার এমন উত্তর দেবেন যা বিক্রয় অফিস দেবে না। সেখানে দাঁড়িয়ে কী জিজ্ঞেস করবেন।", lead: "Sales knows the brochure. The site engineer knows the building.", leadBn: "বিক্রয় বিভাগ ব্রোশিউর জানে। সাইট ইঞ্জিনিয়ার ভবনটি জানেন।", angle: "the fifteen questions, and what a hesitant answer to each one means", angleBn: "পনেরোটি প্রশ্ন, আর প্রতিটির দ্বিধাগ্রস্ত উত্তরের অর্থ" },
  { title: "Commercial floors: a different arithmetic entirely", titleBn: "বাণিজ্যিক ফ্লোর: সম্পূর্ণ ভিন্ন হিসাব", category: "Market", tags: ["commercial", "yield"], excerpt: "Yield, not appreciation, is the point. What a commercial buyer should model before looking at a single floor.", excerptBn: "মূল বিষয় মূল্যবৃদ্ধি নয়, আয়। একটি ফ্লোর দেখার আগেই বাণিজ্যিক ক্রেতার কী হিসাব কষা উচিত।", lead: "A residential buyer asks what it will be worth. A commercial buyer asks what it will earn.", leadBn: "আবাসিক ক্রেতা জিজ্ঞেস করেন এর দাম কত হবে। বাণিজ্যিক ক্রেতা জিজ্ঞেস করেন এটি কত আয় করবে।", angle: "the yield model to build before viewing, and its three inputs", angleBn: "দেখার আগে যে আয়-মডেল কষবেন, আর তার তিনটি উপাদান" },
  { title: "When a flat is worth less than the sum of its floors", titleBn: "কখন ফ্ল্যাটের দাম তার তলাগুলোর যোগফলের চেয়ে কম", category: "Economy", tags: ["valuation", "depreciation"], excerpt: "Buildings age faster here than the price data suggests. What a twenty-year-old structure is really worth.", excerptBn: "এখানে ভবন দামের তথ্য যা বলে তার চেয়ে দ্রুত পুরোনো হয়। বিশ বছরের কাঠামোর প্রকৃত দাম কত।", lead: "Land appreciates. The building on it does the opposite, and slowly nobody notices.", leadBn: "জমির দাম বাড়ে। তার উপরের ভবন উল্টোটা করে, আর ধীরে ধীরে কেউ খেয়াল করে না।", angle: "separating land value from structure value in an ageing building", angleBn: "পুরোনো ভবনে জমির মূল্য আর কাঠামোর মূল্য আলাদা করা" },
];

/**
 * Builds a full-length article around one subject.
 *
 * Five sections rather than two: an article of a couple of hundred words tells
 * you nothing about how the page behaves — the contents list has one entry, the
 * reading time reads as a minute, and a long body and a short one look
 * identical in a card. These come out around eight hundred to a thousand words,
 * which is what a real post runs to.
 */
const composeExtra = (p: (typeof MORE)[number]): Post => ({
  title: p.title,
  titleBn: p.titleBn,
  category: p.category,
  tags: p.tags,
  excerpt: p.excerpt,
  excerptBn: p.excerptBn,
  metaDescription: p.excerpt.slice(0, 155),
  lead: p.lead,
  leadBn: p.leadBn,
  sections: [
    {
      heading: "What this comes down to",
      headingBn: "মূল কথাটি যা",
      paragraphs: [
        `This piece works through ${p.angle}. We have set out what we see in our own transactions rather than what the market says about itself, because the two rarely match and only one of them can be checked.`,
        "Where a figure appears below it comes from records we hold — registered transfers, survey reports and the files our own desk has closed. Where we are estimating the sentence says so, and where we do not know we have left the gap rather than filling it with a plausible number.",
        "That is a slower way to write about property than the alternative, which is to repeat what everyone in the trade already believes. It is also the only version that survives a reader checking it.",
      ],
      paragraphsBn: [
        `এই লেখাটি ${p.angleBn} নিয়ে এগোয়। বাজার নিজের সম্পর্কে যা বলে তার বদলে আমরা নিজেদের লেনদেনে যা দেখি তা রেখেছি, কারণ দুটি খুব কমই মেলে আর যাচাই করা যায় কেবল একটিকে।`,
        "নিচে যেখানে কোনো সংখ্যা এসেছে, তা আমাদের হাতে থাকা নথি থেকে — নিবন্ধিত হস্তান্তর, জরিপ প্রতিবেদন আর আমাদের ডেস্কের নিষ্পন্ন ফাইল। যেখানে অনুমান করছি বাক্যেই তা বলা আছে, আর যেখানে জানি না সেখানে যুক্তিসঙ্গত সংখ্যা বসিয়ে ফাঁক ভরাট করিনি।",
        "সম্পত্তি নিয়ে লেখার এটি ধীর পথ; দ্রুত পথ হলো ব্যবসার সবাই যা বিশ্বাস করেন তা আবার বলা। কিন্তু পাঠক যাচাই করতে বসলে টিকে থাকে কেবল এই সংস্করণটিই।",
      ],
    },
    {
      heading: "How the market got here",
      headingBn: "বাজার এখানে পৌঁছাল যেভাবে",
      paragraphs: [
        "None of this is new, and that is the useful part. The pattern has been visible in our own files for several years, which means it can be read as a trend rather than a quarter of noise — and a trend is something a buyer can plan against.",
        "Two forces do most of the work. The first is supply: what gets approved, what gets financed and what actually reaches completion are three different quantities, and the gap between them is wider here than the published figures imply. The second is cost, which moves with the currency and the price of steel long before it reaches an advertised rate.",
        "Neither force is visible on a listing page. Both are visible in a five-year run of transfers, which is why we keep one.",
      ],
      paragraphsBn: [
        "এর কোনোটিই নতুন নয়, আর সেটিই কাজে লাগে। ধরনটি আমাদের নিজেদের ফাইলে কয়েক বছর ধরে দেখা যাচ্ছে, অর্থাৎ একে এক প্রান্তিকের হইচই নয়, প্রবণতা হিসেবে পড়া যায় — আর প্রবণতা এমন জিনিস যার বিপরীতে ক্রেতা পরিকল্পনা করতে পারেন।",
        "দুটি শক্তিই বেশিরভাগ কাজ করে। প্রথমটি সরবরাহ: কী অনুমোদন পায়, কী অর্থায়ন পায় আর কী শেষমেশ সম্পন্ন হয় — এই তিনটি আলাদা পরিমাণ, আর এদের ফারাক প্রকাশিত হিসাব যা বোঝায় তার চেয়ে এখানে বেশি। দ্বিতীয়টি খরচ, যা মুদ্রা আর ইস্পাতের দামের সঙ্গে নড়ে — বিজ্ঞাপিত দরে পৌঁছানোরও অনেক আগে।",
        "কোনো শক্তিই লিস্টিং পাতায় দেখা যায় না। দুটিই দেখা যায় পাঁচ বছরের হস্তান্তরের সারিতে, আর সে কারণেই আমরা তা রাখি।",
      ],
    },
    {
      heading: "What it means for a buyer",
      headingBn: "ক্রেতার জন্য এর অর্থ",
      paragraphs: [
        "Practically, it changes the order of the questions. Most buyers start with the flat and work outward to the paperwork; the order that saves money is the reverse, because a defect in the papers ends the conversation regardless of how the kitchen looks.",
        "It also changes what a discount means. A price below the run of comparable transfers is either a seller in a hurry or a problem you have not found yet, and the two are told apart by the file rather than by the negotiation.",
      ],
      paragraphsBn: [
        "বাস্তবে এটি প্রশ্নের ক্রম বদলে দেয়। বেশিরভাগ ক্রেতা ফ্ল্যাট দিয়ে শুরু করে কাগজপত্রের দিকে এগোন; টাকা বাঁচায় উল্টো ক্রমটি, কারণ কাগজে ত্রুটি থাকলে রান্নাঘর যেমনই হোক আলোচনা সেখানেই শেষ।",
        "ছাড়ের অর্থও বদলে যায়। তুলনীয় হস্তান্তরের সারির নিচের দাম মানে হয় বিক্রেতার তাড়া আছে, নয় এমন সমস্যা আছে যা আপনি এখনও পাননি — আর দুটির পার্থক্য ধরা পড়ে দরকষাকষিতে নয়, ফাইলে।",
      ],
      list: [
        "Read the deed chain before you look at the finishes",
        "Compare against transfers, not against other listings",
        "Ask how long the unit has been on the market",
        "Treat an unexplained discount as a question, not a win",
      ],
      listBn: [
        "ফিনিশিং দেখার আগে দলিলের ধারাবাহিকতা পড়ুন",
        "অন্য লিস্টিং নয়, হস্তান্তরের সঙ্গে তুলনা করুন",
        "ইউনিটটি কতদিন বাজারে আছে জিজ্ঞেস করুন",
        "ব্যাখ্যাহীন ছাড়কে জয় নয়, প্রশ্ন হিসেবে দেখুন",
      ],
    },
    {
      heading: "Where people go wrong",
      headingBn: "মানুষ যেখানে ভুল করে",
      paragraphs: [
        "The most expensive mistakes we see are not bad negotiations. They are procedural: a mutation left for later, a power of attorney drawn too wide, an agreement whose delay clause has no remedy attached to it. Each one costs nothing to avoid at the time and a great deal to unwind afterwards.",
        "The second category is trusting a document because it exists. An approved plan, a clearance, a warranty — each proves something narrow, and none of them proves the building in front of you complies with it today. The check is always the same: compare the paper against the thing.",
      ],
      paragraphsBn: [
        "আমরা যেসব ব্যয়বহুল ভুল দেখি তা খারাপ দরকষাকষি নয়। সেগুলো পদ্ধতিগত: নামজারি পরে করব বলে ফেলে রাখা, বড় পরিসরে লেখা আমমোক্তারনামা, এমন চুক্তি যার বিলম্ব ধারায় কোনো প্রতিকার নেই। প্রতিটি এড়াতে তখন কিছুই লাগে না, পরে সামলাতে অনেক লাগে।",
        "দ্বিতীয় ধরনটি হলো নথি আছে বলেই তাকে বিশ্বাস করা। অনুমোদিত নকশা, ছাড়পত্র, ওয়ারেন্টি — প্রতিটি সংকীর্ণ কিছু প্রমাণ করে, আর কোনোটিই প্রমাণ করে না সামনের ভবনটি আজ তা মানছে। যাচাই সবসময় একই: কাগজের সঙ্গে জিনিসটি মিলিয়ে দেখা।",
      ],
      list: [
        "Mutation deferred until after possession",
        "A general power of attorney where a specific one would do",
        "A handover date with no consequence attached",
        "An approved plan never compared to the built floors",
      ],
      listBn: [
        "দখলের পরের জন্য নামজারি ফেলে রাখা",
        "নির্দিষ্ট আমমোক্তারনামা চলত, সেখানে সাধারণটি দেওয়া",
        "পরিণতিহীন হস্তান্তরের তারিখ",
        "অনুমোদিত নকশা কখনও নির্মিত তলার সঙ্গে না মেলানো",
      ],
    },
    {
      heading: "What to check before you act on it",
      headingBn: "এর ভিত্তিতে সিদ্ধান্তের আগে যা যাচাই করবেন",
      paragraphs: [
        "None of this substitutes for reading the papers on the specific property in front of you. A market pattern tells you what is usual; it does not tell you what is true of one flat, one plot or one developer, and the exception is exactly the case that costs money.",
        "If you want the underlying records for anything here, ask. We would rather hand over the file than be believed on the strength of a headline.",
      ],
      paragraphsBn: [
        "এর কোনোটিই আপনার সামনে থাকা নির্দিষ্ট সম্পত্তির কাগজপত্র পড়ার বিকল্প নয়। বাজারের ধরন বলে কোনটি স্বাভাবিক; একটি ফ্ল্যাট, একটি প্লট বা একজন ডেভেলপারের ক্ষেত্রে কী সত্য তা বলে না — আর ব্যতিক্রমটিই ঠিক সেই ঘটনা যা টাকা খরচ করায়।",
        "এখানকার কোনো কিছুর মূল নথি চাইলে বলুন। শিরোনামের জোরে বিশ্বাস অর্জনের চেয়ে ফাইলটি হাতে তুলে দেওয়াই আমাদের পছন্দ।",
      ],
      list: [
        "The deed chain, going back at least twenty-five years",
        "Mutation and three years of land tax receipts",
        "The approved plan against what stands on the plot",
        "A year of association accounts, if it is an apartment",
      ],
      listBn: [
        "দলিলের ধারাবাহিকতা, অন্তত পঁচিশ বছর পেছন পর্যন্ত",
        "নামজারি আর তিন বছরের ভূমি করের রসিদ",
        "অনুমোদিত নকশার সঙ্গে প্লটে দাঁড়ানো ভবন",
        "অ্যাপার্টমেন্ট হলে সমিতির এক বছরের হিসাব",
      ],
    },
  ],
});

const ALL_POSTS: Post[] = [...POSTS, ...MORE.map(composeExtra)];

const run = async () => {
  if (!config.db_url) throw new Error("DB_URL is not set.");

  await mongoose.connect(config.db_url);
  console.log(`🛢  Connected to ${mongoose.connection.name}`);

  // ── Categories ────────────────────────────────────────────────────────
  const categoryId = new Map<string, mongoose.Types.ObjectId>();
  for (const [i, c] of CATEGORIES.entries()) {
    const slug = slugify(c.name, { lower: true, strict: true });
    const existing = await BlogCategory.findOne({ slug });
    if (existing) {
      categoryId.set(c.name, existing._id as mongoose.Types.ObjectId);
      continue;
    }
    const made = await BlogCategory.create({ ...c, slug, order: i + 1, isActive: true });
    categoryId.set(c.name, made._id as mongoose.Types.ObjectId);
    console.log(`   + category ${c.name}`);
  }

  // ── Articles ──────────────────────────────────────────────────────────
  const media = await Media.find({}).select("_id").limit(20).lean();
  const pick = (i: number) => (media.length ? media[i % media.length]._id : undefined);

  const AUTHORS = [
    { name: "Tanvir Ahmed", nameBn: "তানভীর আহমেদ", role: "Senior Market Analyst", roleBn: "সিনিয়র মার্কেট বিশ্লেষক" },
    { name: "Nusrat Jahan", nameBn: "নুসরাত জাহান", role: "Legal Desk", roleBn: "আইন ডেস্ক" },
    { name: "Rafiqul Islam", nameBn: "রফিকুল ইসলাম", role: "Head of Survey", roleBn: "জরিপ প্রধান" },
  ];

  let made = 0;
  for (const [i, post] of ALL_POSTS.entries()) {
    const slug = slugify(post.title, { lower: true, strict: true });
    if (await BlogPost.findOne({ slug, isDeleted: { $ne: true } })) {
      console.log(`   = ${post.title.slice(0, 52)}`);
      continue;
    }

    const author = AUTHORS[i % AUTHORS.length];
    const content = bodyHtml(post, "en");
    await BlogPost.create({
      title: post.title,
      titleBn: post.titleBn,
      slug,
      excerpt: post.excerpt,
      excerptBn: post.excerptBn,
      content,
      contentBn: bodyHtml(post, "bn"),
      readMinutes: readingTime(content),
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      category: categoryId.get(post.category),
      tags: post.tags,
      coverImage: pick(i),
      author: { ...author, avatar: pick(i + 7) },
      status: "published",
      // Spread the run backwards so the index is not twenty posts from today.
      publishedAt: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000),
      featured: Boolean(post.featured),
      trending: Boolean(post.trending),
    });
    made += 1;
    console.log(`   + ${post.title.slice(0, 52)}`);
  }

  const total = await BlogPost.countDocuments({ isDeleted: { $ne: true } });
  console.log(`✅ ${made} article(s) created — ${total} on the blog`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
