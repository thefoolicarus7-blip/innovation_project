import multer from "multer";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});
