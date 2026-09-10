import mongoose from "mongoose";

import config from "../app/config";
import { DynamicContent } from "../app/modules/dynamicContent/dynamicContent.model";

/**
 * The social links the footer and the contact page start with.
 *
 * These live in the CMS rather than in the site's dictionaries, because the
 * desk has to be able to *shorten* the list, not only edit it. A dictionary
 * default cannot be removed from the panel: clearing a box means "unchanged"
 * everywhere in this system, so the built-in would come straight back. With
 * the list owned by the database, adding a row, changing an icon and deleting
 * a network all behave the way the panel says they do.
 *
 * The icon is a Font Awesome class string. Any free icon from
 * fontawesome.com works — the site loads Font Awesome 6 and draws whatever
 * class it is given.
 *
 * Idempotent on key: run it as often as you like. It will not overwrite a row
 * the desk has already edited, so it is safe on a live database.
 *
 *   npm run seed:social
 */
const NETWORKS = [
  { label: "Facebook", icon: "fa-brands fa-facebook-f", href: "https://facebook.com" },
  { label: "Instagram", icon: "fa-brands fa-instagram", href: "https://instagram.com" },
  { label: "X", icon: "fa-brands fa-x-twitter", href: "https://x.com" },
  { label: "LinkedIn", icon: "fa-brands fa-linkedin-in", href: "https://linkedin.com" },
  { label: "YouTube", icon: "fa-brands fa-youtube", href: "https://youtube.com" },
  { label: "WhatsApp", icon: "fa-brands fa-whatsapp", href: "https://wa.me/8801958253301" },
];

const GROUP = "contact";
const PREFIX = "contact.social";

/**
 * One row per value per language, which is how the panel stores everything.
 *
 * An icon class and a URL are the same in both languages, so both rows carry
 * the same string — the panel does exactly this for its `icon` and `url`
 * fields. The name is a brand name, so it is also the same; it is stored per
 * language anyway so the desk can write it in Bangla if it wants to.
 */
const rowsFor = (index: number, network: (typeof NETWORKS)[number]) =>
  (["icon", "href", "label"] as const).flatMap((field) =>
    (["en", "bn"] as const).map((lang) => ({
      key: `${PREFIX}.${index}.${field}.${lang}`,
      value: network[field],
      group: GROUP,
      type: "text",
    })),
  );

const main = async () => {
  await mongoose.connect(config.db_url as string);

  let written = 0;
  let kept = 0;

  for (const [index, network] of NETWORKS.entries()) {
    for (const row of rowsFor(index, network)) {
      const existing = await DynamicContent.findOne({ key: row.key }).lean();
      if (existing) {
        kept += 1;
        continue;
      }
      await DynamicContent.updateOne(
        { key: row.key },
        { $set: row, $setOnInsert: { isActive: true } },
        { upsert: true },
      );
      written += 1;
    }
  }

  console.log(
    `social links: ${written} row(s) written, ${kept} left as they were ` +
      `(${NETWORKS.length} networks)`,
  );

  await mongoose.disconnect();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
