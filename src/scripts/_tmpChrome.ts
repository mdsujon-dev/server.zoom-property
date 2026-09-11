import mongoose from "mongoose";
import config from "../app/config";
import { DynamicContent } from "../app/modules/dynamicContent/dynamicContent.model";

/** Throwaway: add a menu item, add a dock cell, remove one of each. */
const ADD = [
  { key: "nav.menu.6.label.en", value: "Reviews", group: "headerFooter" },
  { key: "nav.menu.6.href.en", value: "/reviews", group: "headerFooter" },
  { key: "contact.dock.3.icon.en", value: "fa-brands fa-facebook-messenger", group: "contact" },
  { key: "contact.dock.3.label.en", value: "Messenger", group: "contact" },
  { key: "contact.dock.3.href.en", value: "https://m.me/zoomproperty", group: "contact" },
];
// Remove the Blog menu item (index 4) and the WhatsApp dock cell (index 1).
const DEL = ["nav.menu.4.label", "nav.menu.4.href", "contact.dock.1.icon",
             "contact.dock.1.label", "contact.dock.1.href"]
  .flatMap((k) => [`${k}.en`, `${k}.bn`]);

const main = async () => {
  await mongoose.connect(config.db_url as string);
  if (process.argv[2] === "clean") {
    await DynamicContent.deleteMany({ key: { $in: ADD.map((r) => r.key) } });
    console.log("removed the test rows");
  } else {
    for (const r of ADD)
      await DynamicContent.updateOne(
        { key: r.key },
        { $set: { ...r, type: "text" }, $setOnInsert: { isActive: true } },
        { upsert: true },
      );
    const d = await DynamicContent.deleteMany({ key: { $in: DEL } });
    console.log("added 2 rows, deleted", d.deletedCount, "rows");
  }
  await mongoose.disconnect();
};
main().catch((e) => { console.error(e); process.exit(1); });
