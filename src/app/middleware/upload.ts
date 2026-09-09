import fs from "fs";
import multer from "multer";
import path from "path";

// Default generic uploads (media library, misc) — flat under /uploads.
const uploadPath = path.join(__dirname, "../../../uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const originalName = path.parse(file.originalname).name;
    const ext = path.extname(file.originalname);
    let finalName = `${originalName}${ext}`;
    let counter = 1;

    while (fs.existsSync(path.join(uploadPath, finalName))) {
      finalName = `${originalName}-${counter}${ext}`;
      counter++;
    }

    cb(null, finalName);
  },
});

export const upload = multer({ storage });

// -------- Profile image uploads --------
// Kept under a "profile-image" prefix so they can be listed, cleaned up or
// migrated independently of everything else, and named with the uploader's
// user id so ownership reads off the key without a DB lookup. Both of those
// now happen in the controller, next to the store that receives the file.

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/*
 * Held in memory, not written here.
 *
 * This used to be a disk engine that named the file and dropped it in
 * `uploads/profile-image/`, and the container it landed in was replaced on the
 * next deploy — so every avatar in the system went to a 404 and the header fell
 * back to a blank circle. Where the bytes end up is now `utils/storeUpload`'s
 * decision, and it puts them in R2.
 *
 * A 5 MB cap makes buffering safe; it is the same cap that was already here.
 */
export const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpg, png, webp, gif)"));
    }
  },
});
