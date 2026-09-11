import mongoose from "mongoose";

import config from "../app/config";
import { Area } from "../app/modules/area/area.model";
import { Media } from "../app/modules/media-library/media-library.model";
import { Project } from "../app/modules/project/project.model";
import { ProjectService } from "../app/modules/project/project.service";
import { Property } from "../app/modules/property/property.model";

/**
 * Replaces the project catalogue with ten fully filled developments.
 *
 * Destructive on purpose: it removes every existing project first, so the set
 * this produces is the whole catalogue rather than ten more on top of what was
 * there. That is the one thing to know before running it.
 *
 * Properties carry a reference to the project they sit in. Deleting the old
 * projects would leave those references pointing at nothing, and the listing
 * page would show a blank where the development should be — so every affected
 * property is re-pointed at a new project in the same area, or cleared when
 * there is no match. That relinking is the reason this is a script and not a
 * pair of database commands.
 *
 * Every field the model has is filled: the milestone breakdown, the permit
 * number, the day somebody last walked the site, the walkthrough film and both
 * languages of the description. A project page is supposed to be the thing
 * that is checkable, and a half-filled record makes it a brochure.
 *
 *   npm run seed:projects
 */
type Milestone = {
  label: string;
  labelBn: string;
  percent: number;
  completed: boolean;
};

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
  cctvStreamActive: boolean;
  isHome: boolean;
  featured: boolean;
  /** Days since somebody from the agency last walked the site. */
  inspectedDaysAgo: number;
  videoTitle: string;
  videoTitleBn: string;
  youtubeUrl: string;
  videoDuration: string;
  milestones: Milestone[];
  description: string[];
  descriptionBn: string[];
};

const PROJECTS: ProjectSeed[] = [
  {
    name: "Rangs Meridian Tower",
    nameBn: "র‍্যাংগস মেরিডিয়ান টাওয়ার",
    developer: "Rangs Properties",
    area: "Gulshan (1 & 2)",
    stage: "Processing",
    handover: "Q2 2028",
    units: 54,
    unitsLeft: 21,
    sizeRange: "2,400 – 3,850 sq ft",
    startingPrice: 82000000,
    rajukPermitNo: "RAJUK/GUL/2025/0241",
    cctvStreamActive: true,
    isHome: true,
    featured: true,
    inspectedDaysAgo: 6,
    videoTitle: "Structure walkthrough, floors 9 to 14",
    videoTitleBn: "৯ থেকে ১৪ তলা পর্যন্ত কাঠামো পরিদর্শন",
    youtubeUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    videoDuration: "04:12",
    milestones: [
      { label: "Piling and pile cap", labelBn: "পাইলিং ও পাইল ক্যাপ", percent: 20, completed: true },
      { label: "Basement and podium", labelBn: "বেসমেন্ট ও পোডিয়াম", percent: 15, completed: true },
      { label: "Structure to 14th floor", labelBn: "১৪ তলা পর্যন্ত কাঠামো", percent: 30, completed: true },
      { label: "Facade and glazing", labelBn: "ফ্যাসাদ ও গ্লেজিং", percent: 20, completed: false },
      { label: "Fit-out and handover", labelBn: "ফিট-আউট ও হস্তান্তর", percent: 15, completed: false },
    ],
    description: [
      "Fifty-four apartments on a corner plot three minutes' walk from Gulshan 2 circle. The RAJUK plan and the title chain were both read line by line before a single unit was offered.",
      "Two lifts and a service lift for fifty-four homes, which is the ratio that decides whether a tower is liveable at eight in the morning. The generator is sized for full load, not for lifts and lights only.",
    ],
    descriptionBn: [
      "গুলশান ২ চক্কর থেকে তিন মিনিট হাঁটার দূরত্বে কর্নার প্লটে চুয়ান্নটি অ্যাপার্টমেন্ট। একটি ইউনিটও ছাড়ার আগে রাজউক নকশা ও দলিলের ধারাবাহিকতা লাইন ধরে পড়া হয়েছে।",
      "চুয়ান্নটি ফ্ল্যাটের জন্য দুটি লিফট ও একটি সার্ভিস লিফট — সকাল আটটায় টাওয়ারটি বাসযোগ্য কি না তা এই অনুপাতেই ঠিক হয়। জেনারেটর পূর্ণ লোডের জন্য, শুধু লিফট-বাতির জন্য নয়।",
    ],
  },
  {
    name: "Sheltech Lakeshore Banani",
    nameBn: "শেলটেক লেকশোর বনানী",
    developer: "Sheltech Pvt Ltd",
    area: "Banani",
    stage: "Processing",
    handover: "Q4 2027",
    units: 36,
    unitsLeft: 11,
    sizeRange: "1,950 – 2,700 sq ft",
    startingPrice: 61000000,
    rajukPermitNo: "RAJUK/BAN/2024/0873",
    cctvStreamActive: true,
    isHome: true,
    featured: true,
    inspectedDaysAgo: 11,
    videoTitle: "Lake-facing units and the west elevation",
    videoTitleBn: "লেকমুখী ইউনিট ও পশ্চিম দিকের ফ্যাসাদ",
    youtubeUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    videoDuration: "03:28",
    milestones: [
      { label: "Piling complete", labelBn: "পাইলিং সম্পন্ন", percent: 20, completed: true },
      { label: "Structure to 9th floor", labelBn: "৯ তলা পর্যন্ত কাঠামো", percent: 30, completed: true },
      { label: "Masonry and plaster", labelBn: "গাঁথুনি ও প্লাস্টার", percent: 25, completed: false },
      { label: "Finishing and handover", labelBn: "ফিনিশিং ও হস্তান্তর", percent: 25, completed: false },
    ],
    description: [
      "Thirty-six units on Banani Road 11, of which fourteen face the lake. The road-side flats are quieter than the lake-side ones after nine at night, which is the opposite of what most buyers assume.",
      "Parking is one bay per unit with eight visitor bays, all inside the boundary. No stacked parking and no allocation on the approach road.",
    ],
    descriptionBn: [
      "বনানী ১১ নম্বর রোডে ছত্রিশটি ইউনিট, যার চৌদ্দটি লেকমুখী। রাত নয়টার পর রাস্তার পাশের ফ্ল্যাটগুলো লেকের পাশের চেয়ে শান্ত — বেশিরভাগ ক্রেতা যা ধরে নেন তার উল্টো।",
      "প্রতি ইউনিটে একটি করে পার্কিং, সঙ্গে আটটি অতিথি বে, সবই সীমানার ভেতরে। স্ট্যাকড পার্কিং নেই, রাস্তার ওপর বরাদ্দও নেই।",
    ],
  },
  {
    name: "Baridhara Ambassador Court",
    nameBn: "বারিধারা অ্যাম্বাসেডর কোর্ট",
    developer: "Building Technology & Ideas Ltd",
    area: "Baridhara Diplomatic Zone",
    stage: "Completed",
    handover: "Ready",
    units: 24,
    unitsLeft: 3,
    sizeRange: "3,100 – 4,600 sq ft",
    startingPrice: 128000000,
    rajukPermitNo: "RAJUK/BDR/2021/0055",
    cctvStreamActive: false,
    isHome: true,
    featured: true,
    inspectedDaysAgo: 21,
    videoTitle: "Completed duplex and the roof terrace",
    videoTitleBn: "সম্পন্ন ডুপ্লেক্স ও ছাদের টেরেস",
    youtubeUrl: "https://www.youtube.com/watch?v=BHACKCNDMW8",
    videoDuration: "05:03",
    milestones: [
      { label: "Structure", labelBn: "কাঠামো", percent: 35, completed: true },
      { label: "Facade and glazing", labelBn: "ফ্যাসাদ ও গ্লেজিং", percent: 20, completed: true },
      { label: "Services and lifts", labelBn: "সার্ভিস ও লিফট", percent: 20, completed: true },
      { label: "Finishing and handover", labelBn: "ফিনিশিং ও হস্তান্তর", percent: 25, completed: true },
    ],
    description: [
      "Handed over in 2024 and fully occupied except for three units. The occupancy certificate and the fire licence are both on file and we will show you either one before you view.",
      "Three of the twenty-four are duplexes on the top two floors with their own roof terrace. Service charge at handover was 14,500 a month and has not changed since.",
    ],
    descriptionBn: [
      "২০২৪ সালে হস্তান্তর, তিনটি ইউনিট ছাড়া সবই বসবাসে। অকুপেন্সি সার্টিফিকেট ও ফায়ার লাইসেন্স দুটোই আমাদের কাছে আছে — দেখতে আসার আগেই দেখাব।",
      "চব্বিশটির মধ্যে তিনটি উপরের দুই তলার ডুপ্লেক্স, নিজস্ব ছাদ-টেরেসসহ। হস্তান্তরের সময় সার্ভিস চার্জ ছিল মাসে ১৪,৫০০, এখনো তাই।",
    ],
  },
  {
    name: "Concord Dhanmondi Lakeview",
    nameBn: "কনকর্ড ধানমন্ডি লেকভিউ",
    developer: "Concord Real Estate",
    area: "Dhanmondi",
    stage: "Planning",
    handover: "Q1 2030",
    units: 42,
    unitsLeft: 42,
    sizeRange: "1,750 – 2,450 sq ft",
    startingPrice: 47000000,
    rajukPermitNo: "RAJUK/DHN/2026/0012",
    cctvStreamActive: false,
    isHome: false,
    featured: false,
    inspectedDaysAgo: 3,
    videoTitle: "The site before work starts",
    videoTitleBn: "কাজ শুরুর আগে জমির অবস্থা",
    youtubeUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    videoDuration: "02:41",
    milestones: [
      { label: "Land and title cleared", labelBn: "জমি ও দলিল যাচাই সম্পন্ন", percent: 15, completed: true },
      { label: "RAJUK approval", labelBn: "রাজউক অনুমোদন", percent: 15, completed: true },
      { label: "Soil test and design", labelBn: "মাটি পরীক্ষা ও নকশা", percent: 15, completed: false },
      { label: "Piling and structure", labelBn: "পাইলিং ও কাঠামো", percent: 35, completed: false },
      { label: "Finishing and handover", labelBn: "ফিনিশিং ও হস্তান্তর", percent: 20, completed: false },
    ],
    description: [
      "Approved and not yet started. We are listing it at this stage because the launch price is the lowest it will be, and because a buyer at this stage should know exactly how long the wait is: four years, not the two a brochure would imply.",
      "The plot is forty metres off Road 27, so it is a lake view from the fifth floor up and a rooftop view below that. We would rather say so now than have you find out at handover.",
    ],
    descriptionBn: [
      "অনুমোদিত, কাজ এখনো শুরু হয়নি। এই পর্যায়ে তালিকায় দিচ্ছি কারণ দাম এখনই সবচেয়ে কম, আর ক্রেতার জানা উচিত অপেক্ষাটা ঠিক কতদিনের — চার বছর, ব্রোশিওরের ইঙ্গিত দেওয়া দুই বছর নয়।",
      "প্লটটি ২৭ নম্বর রোড থেকে চল্লিশ মিটার ভেতরে, তাই পাঁচতলা থেকে উপরে লেক দেখা যায়, নিচে ছাদ। হস্তান্তরের দিন জানার চেয়ে এখনই বলে দেওয়া ভালো।",
    ],
  },
  {
    name: "Assure Uttara Skyline",
    nameBn: "অ্যাসিওর উত্তরা স্কাইলাইন",
    developer: "Assure Group",
    area: "Uttara (Sectors 1-14)",
    stage: "Processing",
    handover: "Q3 2027",
    units: 60,
    unitsLeft: 27,
    sizeRange: "1,450 – 2,200 sq ft",
    startingPrice: 34000000,
    rajukPermitNo: "RAJUK/UTT/2024/0619",
    cctvStreamActive: true,
    isHome: true,
    featured: false,
    inspectedDaysAgo: 9,
    videoTitle: "Sector 11 site, masonry stage",
    videoTitleBn: "সেক্টর ১১ সাইট, গাঁথুনির পর্যায়",
    youtubeUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    videoDuration: "03:55",
    milestones: [
      { label: "Piling and raft", labelBn: "পাইলিং ও র‍্যাফট", percent: 20, completed: true },
      { label: "Structure to 11th floor", labelBn: "১১ তলা পর্যন্ত কাঠামো", percent: 30, completed: true },
      { label: "Masonry and plaster", labelBn: "গাঁথুনি ও প্লাস্টার", percent: 20, completed: true },
      { label: "Electrical and plumbing", labelBn: "বৈদ্যুতিক ও পানির লাইন", percent: 15, completed: false },
      { label: "Finishing and handover", labelBn: "ফিনিশিং ও হস্তান্তর", percent: 15, completed: false },
    ],
    description: [
      "Sixty units in Sector 11, eight minutes from the metro station at Uttara Centre. The metro is the reason this sector's resale has held up, and it is a fair reason.",
      "Sizes start at 1,450 sq ft, which in Uttara means a genuine three-bedroom rather than a two with a study called a third.",
    ],
    descriptionBn: [
      "সেক্টর ১১-তে ষাটটি ইউনিট, উত্তরা সেন্টার মেট্রো স্টেশন থেকে আট মিনিট। এই সেক্টরে পুনর্বিক্রয়ের দাম যে ধরে রেখেছে তার কারণ মেট্রো — এবং কারণটি যুক্তিসঙ্গত।",
      "আকার শুরু ১,৪৫০ বর্গফুট থেকে, উত্তরায় যার মানে সত্যিকারের তিন বেডরুম — দুই বেডরুমের সঙ্গে একটা স্টাডিকে তৃতীয় বলা নয়।",
    ],
  },
  {
    name: "Bashundhara Parkline Residences",
    nameBn: "বসুন্ধরা পার্কলাইন রেসিডেন্স",
    developer: "Bashundhara Group",
    area: "Bashundhara Residential Area",
    stage: "Processing",
    handover: "Q1 2028",
    units: 72,
    unitsLeft: 40,
    sizeRange: "1,600 – 2,900 sq ft",
    startingPrice: 38500000,
    rajukPermitNo: "RAJUK/BSH/2024/1104",
    cctvStreamActive: true,
    isHome: false,
    featured: false,
    inspectedDaysAgo: 14,
    videoTitle: "Block K site, podium and core",
    videoTitleBn: "ব্লক কে সাইট, পোডিয়াম ও কোর",
    youtubeUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    videoDuration: "04:37",
    milestones: [
      { label: "Piling complete", labelBn: "পাইলিং সম্পন্ন", percent: 20, completed: true },
      { label: "Podium and two basements", labelBn: "পোডিয়াম ও দুই বেসমেন্ট", percent: 20, completed: true },
      { label: "Structure to 8th floor", labelBn: "৮ তলা পর্যন্ত কাঠামো", percent: 25, completed: false },
      { label: "Services and facade", labelBn: "সার্ভিস ও ফ্যাসাদ", percent: 20, completed: false },
      { label: "Finishing and handover", labelBn: "ফিনিশিং ও হস্তান্তর", percent: 15, completed: false },
    ],
    description: [
      "Seventy-two units in Block K facing the park strip. Two basements, which matters here: Bashundhara's water table means a single basement floods in a bad monsoon and this one is pumped and tanked.",
      "Forty units are still unsold, so the choice of floor and aspect is real rather than a choice between what is left.",
    ],
    descriptionBn: [
      "ব্লক কে-তে পার্কমুখী বাহাত্তরটি ইউনিট। দুটি বেসমেন্ট, যা এখানে গুরুত্বপূর্ণ: বসুন্ধরার পানির স্তরের কারণে খারাপ বর্ষায় একক বেসমেন্টে পানি ওঠে — এটিতে পাম্প ও ট্যাংকিং করা।",
      "চল্লিশটি ইউনিট এখনো অবিক্রীত, তাই তলা ও দিক বেছে নেওয়ার সুযোগ সত্যিকারের — যা পড়ে আছে তার মধ্য থেকে বাছাই নয়।",
    ],
  },
  {
    name: "Mirpur DOHS Officers Enclave",
    nameBn: "মিরপুর ডিওএইচএস অফিসার্স এনক্লেভ",
    developer: "Rupayan Housing Estate",
    area: "Mirpur DOHS",
    stage: "Completed",
    handover: "Ready",
    units: 30,
    unitsLeft: 5,
    sizeRange: "1,500 – 2,050 sq ft",
    startingPrice: 29500000,
    rajukPermitNo: "RAJUK/MPR/2020/0388",
    cctvStreamActive: false,
    isHome: false,
    featured: false,
    inspectedDaysAgo: 28,
    videoTitle: "Ready flats, Avenue 5",
    videoTitleBn: "প্রস্তুত ফ্ল্যাট, এভিনিউ ৫",
    youtubeUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    videoDuration: "03:16",
    milestones: [
      { label: "Structure", labelBn: "কাঠামো", percent: 35, completed: true },
      { label: "Masonry and services", labelBn: "গাঁথুনি ও সার্ভিস", percent: 25, completed: true },
      { label: "Finishing", labelBn: "ফিনিশিং", percent: 25, completed: true },
      { label: "Handover", labelBn: "হস্তান্তর", percent: 15, completed: true },
    ],
    description: [
      "Handed over in 2023. Five units remain, all on the third floor and below, which is why they are still here — everything from the fourth up went in the first year.",
      "DOHS security and a gate log, so a visitor is signed in. For a family buying their first flat that is worth more than a gym nobody uses.",
    ],
    descriptionBn: [
      "২০২৩ সালে হস্তান্তর। পাঁচটি ইউনিট বাকি, সবই তৃতীয় তলা ও তার নিচে — সে কারণেই রয়ে গেছে; চতুর্থ তলার উপরেরগুলো প্রথম বছরেই বিক্রি হয়ে যায়।",
      "ডিওএইচএস নিরাপত্তা ও গেট লগ, তাই অতিথির নাম লেখা হয়। প্রথম ফ্ল্যাট কেনা পরিবারের কাছে এটি অব্যবহৃত জিমের চেয়ে বেশি দামি।",
    ],
  },
  {
    name: "Navana Mohakhali Business Court",
    nameBn: "নাভানা মহাখালী বিজনেস কোর্ট",
    developer: "Navana Real Estate",
    area: "Mohakhali DOHS",
    stage: "Planning",
    handover: "Q3 2029",
    units: 28,
    unitsLeft: 28,
    sizeRange: "2,200 – 6,400 sq ft",
    startingPrice: 74000000,
    rajukPermitNo: "RAJUK/MHK/2026/0031",
    cctvStreamActive: false,
    isHome: false,
    featured: false,
    inspectedDaysAgo: 5,
    videoTitle: "Approved drawings and the plot",
    videoTitleBn: "অনুমোদিত নকশা ও প্লট",
    youtubeUrl: "https://www.youtube.com/watch?v=BHACKCNDMW8",
    videoDuration: "02:58",
    milestones: [
      { label: "Land and title cleared", labelBn: "জমি ও দলিল যাচাই সম্পন্ন", percent: 15, completed: true },
      { label: "RAJUK approval", labelBn: "রাজউক অনুমোদন", percent: 20, completed: true },
      { label: "Piling and basement", labelBn: "পাইলিং ও বেসমেন্ট", percent: 25, completed: false },
      { label: "Structure", labelBn: "কাঠামো", percent: 25, completed: false },
      { label: "Fit-out and handover", labelBn: "ফিট-আউট ও হস্তান্তর", percent: 15, completed: false },
    ],
    description: [
      "Commercial floors, not apartments. Twenty-eight units from a 2,200 sq ft suite to a 6,400 sq ft full floor, with the mezzanine question settled in the approved drawing rather than argued about later.",
      "Three years and a quarter to handover. A business signing for a floor at this stage is buying the price, and should plan its lease accordingly.",
    ],
    descriptionBn: [
      "অ্যাপার্টমেন্ট নয়, বাণিজ্যিক ফ্লোর। ২,২০০ বর্গফুটের স্যুট থেকে ৬,৪০০ বর্গফুটের পূর্ণ ফ্লোর পর্যন্ত আটাশটি ইউনিট; মেজানিনের প্রশ্নটি অনুমোদিত নকশাতেই মীমাংসিত, পরে তর্কের জন্য ফেলে রাখা নয়।",
      "হস্তান্তরে সোয়া তিন বছর। এই পর্যায়ে ফ্লোর নেওয়া মানে দামটা কেনা — প্রতিষ্ঠানের ভাড়ার পরিকল্পনা সেভাবেই করা উচিত।",
    ],
  },
  {
    name: "Nikunja Courtyard Two",
    nameBn: "নিকুঞ্জ কোর্টইয়ার্ড টু",
    developer: "Anwar Landmark",
    area: "Nikunja 1 & 2",
    stage: "Processing",
    handover: "Q2 2027",
    units: 26,
    unitsLeft: 9,
    sizeRange: "1,350 – 1,900 sq ft",
    startingPrice: 31500000,
    rajukPermitNo: "RAJUK/NKJ/2024/0207",
    cctvStreamActive: true,
    isHome: true,
    featured: false,
    inspectedDaysAgo: 8,
    videoTitle: "Courtyard and the finishing floors",
    videoTitleBn: "কোর্টইয়ার্ড ও ফিনিশিং চলা তলাগুলো",
    youtubeUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    videoDuration: "03:07",
    milestones: [
      { label: "Piling and raft", labelBn: "পাইলিং ও র‍্যাফট", percent: 20, completed: true },
      { label: "Structure complete", labelBn: "কাঠামো সম্পন্ন", percent: 30, completed: true },
      { label: "Masonry and plaster", labelBn: "গাঁথুনি ও প্লাস্টার", percent: 20, completed: true },
      { label: "Finishing and handover", labelBn: "ফিনিশিং ও হস্তান্তর", percent: 30, completed: false },
    ],
    description: [
      "Twenty-six units around an open courtyard, so every flat has cross ventilation rather than a light well. Airport road is four minutes away and audible from the north face — bring someone with you in the evening before you decide.",
      "Structure is topped out and finishing is on the lower six floors. Handover in eighteen months is realistic on what we saw last week.",
    ],
    descriptionBn: [
      "খোলা কোর্টইয়ার্ড ঘিরে ছাব্বিশটি ইউনিট, তাই প্রতিটি ফ্ল্যাটে ক্রস ভেন্টিলেশন — আলো-বাতাসের সরু ফাঁক নয়। এয়ারপোর্ট রোড চার মিনিট দূরে এবং উত্তর দিকে শব্দ আসে; সিদ্ধান্তের আগে সন্ধ্যায় একবার কাউকে নিয়ে আসুন।",
      "কাঠামো শেষ, নিচের ছয় তলায় ফিনিশিং চলছে। গত সপ্তাহে যা দেখেছি তাতে আঠারো মাসে হস্তান্তর বাস্তবসম্মত।",
    ],
  },
  {
    name: "Purbachal Lakefront Villas",
    nameBn: "পূর্বাচল লেকফ্রন্ট ভিলাস",
    developer: "Sheltech Pvt Ltd",
    area: "Purbachal New Town",
    stage: "Planning",
    handover: "Q4 2029",
    units: 18,
    unitsLeft: 18,
    sizeRange: "3,200 – 4,800 sq ft",
    startingPrice: 56000000,
    rajukPermitNo: "RAJUK/PRB/2026/0044",
    cctvStreamActive: false,
    isHome: false,
    featured: false,
    inspectedDaysAgo: 2,
    videoTitle: "The plots, the lake and the access road",
    videoTitleBn: "প্লট, লেক ও প্রবেশ সড়ক",
    youtubeUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    videoDuration: "04:49",
    milestones: [
      { label: "Plot allotment cleared", labelBn: "প্লট বরাদ্দ যাচাই সম্পন্ন", percent: 20, completed: true },
      { label: "RAJUK approval", labelBn: "রাজউক অনুমোদন", percent: 15, completed: true },
      { label: "Access road and utilities", labelBn: "প্রবেশ সড়ক ও সংযোগ", percent: 20, completed: false },
      { label: "Construction", labelBn: "নির্মাণ", percent: 30, completed: false },
      { label: "Finishing and handover", labelBn: "ফিনিশিং ও হস্তান্তর", percent: 15, completed: false },
    ],
    description: [
      "Eighteen detached villas on Sector 9 lakefront plots. Gas is not connected in this sector and there is no date for it — the design is electric throughout, and the price reflects the cost of that rather than hiding it.",
      "The access road is built to the sector gate and unfinished for the last four hundred metres. That is in the programme above, with its own share of the build, because it is the part that decides whether you can live there in 2030.",
    ],
    descriptionBn: [
      "সেক্টর ৯-এর লেকমুখী প্লটে আঠারোটি আলাদা ভিলা। এই সেক্টরে গ্যাস সংযোগ নেই, কবে হবে তারও তারিখ নেই — নকশা পুরোপুরি বিদ্যুৎনির্ভর, আর দামে সেই খরচ লুকানো নয়, ধরা আছে।",
      "প্রবেশ সড়ক সেক্টর গেট পর্যন্ত তৈরি, শেষ চারশো মিটার অসমাপ্ত। উপরের অগ্রগতির তালিকায় সেটির নিজস্ব ভাগ আছে, কারণ ২০৩০ সালে ওখানে থাকা যাবে কি না তা এটিই ঠিক করবে।",
    ],
  },
];

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const run = async () => {
  if (!config.db_url) throw new Error("DB_URL is not set.");

  await mongoose.connect(config.db_url);
  console.log(`🛢  Connected to ${mongoose.connection.name}`);

  const areas = await Area.find({ isDeleted: { $ne: true } }).select("_id name");
  if (!areas.length) throw new Error("No areas exist — seed areas before projects.");

  const areaByName = new Map(areas.map((a) => [a.name, a._id]));
  const areaFor = (name: string) => {
    const found = areaByName.get(name);
    if (!found) console.log(`   ! no area named "${name}" — falling back`);
    return found ?? areas[0]._id;
  };

  const media = await Media.find({ isDeleted: { $ne: true } })
    .select("_id")
    .limit(22)
    .lean();
  const pick = (i: number) => (media.length ? media[i % media.length]._id : undefined);
  const gallery = (i: number) =>
    media.length ? [pick(i), pick(i + 3), pick(i + 6), pick(i + 9)].filter(Boolean) : [];

  // ── out with the old ──────────────────────────────────────────────────
  const old = await Project.find({}).select("_id name").lean();
  const oldIds = old.map((p) => p._id);

  if (oldIds.length) {
    // Clear the listings' references first. Doing it the other way round
    // leaves a window where a property points at a project that is gone.
    const detached = await Property.updateMany(
      { project: { $in: oldIds } },
      { $unset: { project: "" } },
    );
    await Project.deleteMany({ _id: { $in: oldIds } });
    console.log(
      `🗑  removed ${oldIds.length} project(s), detached ${detached.modifiedCount} listing(s)`,
    );
  }

  // ── in with the new ───────────────────────────────────────────────────
  const madeByArea = new Map<string, unknown>();
  let made = 0;

  for (const [i, seed] of PROJECTS.entries()) {
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
      cctvStreamActive: seed.cctvStreamActive,
      coverImage: pick(i),
      images: gallery(i),
      description: seed.description,
      descriptionBn: seed.descriptionBn,
      video: {
        title: seed.videoTitle,
        titleBn: seed.videoTitleBn,
        youtubeUrl: seed.youtubeUrl,
        poster: pick(i + 1),
        duration: seed.videoDuration,
      },
      milestones: seed.milestones,
      lastInspected: daysAgo(seed.inspectedDaysAgo),
      featured: seed.featured,
      isHome: seed.isHome,
      order: i,
      isActive: true,
    } as any);

    madeByArea.set(seed.area, created._id);
    made += 1;
    console.log(`   + ${seed.name} (${seed.stage}, ${created.progress}%)`);
  }

  // ── relink the listings that lost their project ───────────────────────
  // Matched on area, which is the only honest link available: a listing in
  // Banani belongs in the Banani development or in none at all.
  let relinked = 0;
  const orphans = await Property.find({
    isDeleted: { $ne: true },
    $or: [{ project: { $exists: false } }, { project: null }],
  })
    .select("_id title area")
    .populate({ path: "area", select: "name" })
    .lean();

  for (const property of orphans as any[]) {
    const projectId = madeByArea.get(property.area?.name);
    if (!projectId) continue;
    await Property.updateOne({ _id: property._id }, { $set: { project: projectId } });
    relinked += 1;
  }

  console.log(`\n✅ ${made} project(s) created, ${relinked} listing(s) relinked`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
