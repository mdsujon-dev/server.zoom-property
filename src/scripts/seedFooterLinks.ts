import mongoose from "mongoose";

import config from "../app/config";
import { DynamicContent } from "../app/modules/dynamicContent/dynamicContent.model";

/**
 * The footer's two link columns, as the site starts with them.
 *
 * These live in the CMS rather than in the site's dictionaries for the same
 * reason the social links do: the desk has to be able to *remove* a link, not
 * only rename one. An empty box in the panel means "unchanged" everywhere in
 * this system, so a built-in default always comes back — owning the list is
 * what makes the remove button do what it says.
 *
 * Idempotent on key: it will not overwrite a row the desk has already edited,
 * so it is safe on a live database.
 *
 *   npm run seed:footer
 */
const COLUMNS = [
  {
    prefix: "footer.exploreLinks",
    links: [
      { en: "Properties", bn: "প্রপার্টি", href: "/properties" },
      { en: "Projects", bn: "প্রজেক্ট", href: "/projects" },
      { en: "Areas", bn: "এলাকা", href: "/areas" },
      { en: "Advisors", bn: "পরামর্শদাতা", href: "/agents" },
    ],
  },
  {
    prefix: "footer.serviceLinks",
    links: [
      { en: "Landowners", bn: "জমির মালিক", href: "/landowners" },
      { en: "Reviews", bn: "রিভিউ", href: "/reviews" },
      { en: "Blog", bn: "ব্লগ", href: "/blog" },
      { en: "About us", bn: "আমাদের সম্পর্কে", href: "/about" },
    ],
  },
];

const GROUP = "headerFooter";

const main = async () => {
  if (!config.db_url) throw new Error("DB_URL is not set.");
  await mongoose.connect(config.db_url);

  let written = 0;
  let kept = 0;

  for (const column of COLUMNS) {
    for (const [index, link] of column.links.entries()) {
      // A path is the same in both languages; only the words differ.
      const rows = [
        { key: `${column.prefix}.${index}.label.en`, value: link.en },
        { key: `${column.prefix}.${index}.label.bn`, value: link.bn },
        { key: `${column.prefix}.${index}.href.en`, value: link.href },
        { key: `${column.prefix}.${index}.href.bn`, value: link.href },
      ];

      for (const row of rows) {
        const existing = await DynamicContent.findOne({ key: row.key }).lean();
        if (existing) {
          kept += 1;
          continue;
        }
        await DynamicContent.updateOne(
          { key: row.key },
          {
            $set: { ...row, group: GROUP, type: "text" },
            $setOnInsert: { isActive: true },
          },
          { upsert: true },
        );
        written += 1;
      }
    }
  }

  console.log(
    `footer links: ${written} row(s) written, ${kept} left as they were ` +
      `(${COLUMNS.reduce((n, c) => n + c.links.length, 0)} links)`,
  );

  await mongoose.disconnect();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
