import multer from "multer";

export const upload = multer({ storage: multer.memoryStorage() });

export function toFile(f?: Express.Multer.File): File | null {
  return f
    ? new File([new Uint8Array(f.buffer)], f.originalname, { type: f.mimetype })
    : null;
}
