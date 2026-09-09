import fs from "fs";
import path from "path";

import {
  PutObjectCommand,
  R2_BUCKET,
  isR2Configured,
  r2,
  r2PublicUrl,
} from "./r2";

/** Where the local fallback writes, and what `/uploads` is served from. */
const diskRoot = path.join(__dirname, "../../../uploads");

/**
 * Puts an uploaded file somewhere it will still be next week, and says where.
 *
 * The container's own disk is not that place. Every deploy builds a fresh image
 * and starts a fresh container, so anything written to `uploads/` between
 * deploys is gone at the next one — and because the URL was saved in the
 * database, what the browser gets afterwards is a 404 where a face used to be.
 * That is what happened to every profile picture on the last deploy.
 *
 * R2 is the place: object storage, outside the container's lifetime, already
 * carrying the media library and already configured in production.
 *
 * The disk is kept only as a fallback for a machine with no R2 credentials —
 * a developer's laptop — where losing a file on restart costs nothing. It is
 * never the answer in production, and `isR2Configured` is what tells them
 * apart rather than a NODE_ENV check, because the question is not which
 * environment this is, it is whether there is anywhere better to put the file.
 */
export const storeUpload = async (
  file: Express.Multer.File,
  options: {
    /** Subfolder, both in the bucket and on disk: "profile-image". */
    folder: string;
    /** Filename without extension — the caller owns the naming scheme. */
    basename: string;
    /** Only used by the disk fallback, e.g. "http://localhost:5008". */
    origin: string;
  }
): Promise<string> => {
  const ext = path.extname(file.originalname).toLowerCase() || ".png";
  const key = `${options.folder}/${options.basename}${ext}`;

  if (isR2Configured()) {
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    return r2PublicUrl(key);
  }

  const target = path.join(diskRoot, options.folder);
  await fs.promises.mkdir(target, { recursive: true });
  await fs.promises.writeFile(path.join(target, path.basename(key)), file.buffer);
  return `${options.origin}/uploads/${key}`;
};
