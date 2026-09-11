import mongoose from "mongoose";

import config from "../app/config";
import { DynamicContent } from "../app/modules/dynamicContent/dynamicContent.model";

/**
 * The lists that make up the header, the footer and the side dock.
 *
 * These live in the CMS rather than in the site's dictionaries because the
 * desk has to be able to *remove* a row, not only rename one. An empty box in
 * the panel means "unchanged" everywhere in this system, so a built-in default
 * always comes back — owning the list is what makes the remove button do what
 * it says.
 *
 * Icons are Font Awesome class strings. Any free icon from fontawesome.com
 * works: the site loads Font Awesome 6 and draws whatever class it is given.
 *
 * Idempotent on key: it will not overwrite a row the desk has already edited,
 * so it is safe on a live database.
 *
 *   npm run seed:chrome
 */
const GROUP_HEADER_FOOTER = "headerFooter";
const GROUP_CONTACT = "contact";

/** label + href, one row per menu item. */
const NAV_LISTS = [
  {
    prefix: "nav.menu",
    group: GROUP_HEADER_FOOTER,
    rows: [
      { en: "Properties", bn: "প্রপার্টি", href: "/properties" },
      { en: "Projects", bn: "প্রজেক্ট", href: "/projects" },
      { en: "Areas", bn: "এলাকা", href: "/areas" },
      { en: "Landowners", bn: "জমির মালিক", href: "/landowners" },
      { en: "Blog", bn: "ব্লগ", href: "/blog" },
      { en: "Contact", bn: "যোগাযোগ", href: "/contact" },
    ],
  },
  {
    prefix: "footer.exploreLinks",
    group: GROUP_HEADER_FOOTER,
    rows: [
      { en: "Properties", bn: "প্রপার্টি", href: "/properties" },
      { en: "Projects", bn: "প্রজেক্ট", href: "/projects" },
      { en: "Areas", bn: "এলাকা", href: "/areas" },
      { en: "Advisors", bn: "পরামর্শদাতা", href: "/agents" },
    ],
  },
  {
    prefix: "footer.serviceLinks",
    group: GROUP_HEADER_FOOTER,
    rows: [
      { en: "Landowners", bn: "জমির মালিক", href: "/landowners" },
      { en: "Reviews", bn: "রিভিউ", href: "/reviews" },
      { en: "Blog", bn: "ব্লগ", href: "/blog" },
      { en: "About us", bn: "আমাদের সম্পর্কে", href: "/about" },
    ],
  },
];

/**
 * The side dock: icon, name and a full address.
 *
 * The address is written out rather than derived from the contact details,
 * because the dock is a strip of whatever channels the firm actually answers
 * — a second number, a Messenger link, a Viber address — and not a fixed
 * three. Change the number in Contact and this strip does not follow; that is
 * the cost of being able to put anything in it.
 */
const DOCK = [
  {
    icon: "fa-solid fa-phone",
    en: "Call the desk",
    bn: "সরাসরি ফোন",
    href: "tel:+8801958253301",
  },
  {
    icon: "fa-brands fa-whatsapp",
    en: "WhatsApp",
    bn: "হোয়াটসঅ্যাপ",
    href: "https://wa.me/8801958253301",
  },
  {
    icon: "fa-solid fa-envelope",
    en: "Email",
    bn: "ইমেইল",
    href: "mailto:concierge@zoomproperty.com",
  },
];

const main = async () => {
  if (!config.db_url) throw new Error("DB_URL is not set.");
  await mongoose.connect(config.db_url);

  let written = 0;
  let kept = 0;

  const put = async (key: string, value: string, group: string) => {
    const existing = await DynamicContent.findOne({ key }).lean();
    if (existing) {
      kept += 1;
      return;
    }
    await DynamicContent.updateOne(
      { key },
      {
        $set: { key, value, group, type: "text" },
        $setOnInsert: { isActive: true },
      },
      { upsert: true },
    );
    written += 1;
  };

  for (const list of NAV_LISTS) {
    for (const [i, row] of list.rows.entries()) {
      await put(`${list.prefix}.${i}.label.en`, row.en, list.group);
      await put(`${list.prefix}.${i}.label.bn`, row.bn, list.group);
      // A path is the same in both languages; only the words differ.
      await put(`${list.prefix}.${i}.href.en`, row.href, list.group);
      await put(`${list.prefix}.${i}.href.bn`, row.href, list.group);
    }
  }

  for (const [i, row] of DOCK.entries()) {
    await put(`contact.dock.${i}.icon.en`, row.icon, GROUP_CONTACT);
    await put(`contact.dock.${i}.icon.bn`, row.icon, GROUP_CONTACT);
    await put(`contact.dock.${i}.label.en`, row.en, GROUP_CONTACT);
    await put(`contact.dock.${i}.label.bn`, row.bn, GROUP_CONTACT);
    await put(`contact.dock.${i}.href.en`, row.href, GROUP_CONTACT);
    await put(`contact.dock.${i}.href.bn`, row.href, GROUP_CONTACT);
  }

  const menuCount = NAV_LISTS.reduce((n, l) => n + l.rows.length, 0);
  console.log(
    `site chrome: ${written} row(s) written, ${kept} left as they were ` +
      `(${menuCount} links, ${DOCK.length} dock cells)`,
  );

  await mongoose.disconnect();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
