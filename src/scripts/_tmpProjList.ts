import mongoose from "mongoose";
import config from "../app/config";
import { Project } from "../app/modules/project/project.model";

const main = async () => {
  await mongoose.connect(config.db_url as string);
  const rows = await Project.find({}).select("name slug stage isDeleted createdAt").lean();
  console.log("total project documents:", rows.length);
  for (const r of rows as any[])
    console.log(` ${r.isDeleted ? "[deleted] " : ""}${r.name}  ·  ${r.slug}  ·  ${r.stage}`);
  await mongoose.disconnect();
};
main().catch((e) => { console.error(e); process.exit(1); });
