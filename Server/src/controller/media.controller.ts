import type { Request, Response } from "express";

import { hasCloudinaryCredentials, uploadBufferToCloudinary } from "../services/cloudinary.service.js";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

function resolveDefaultFolder(mimeType: string) {
  return mimeType === "application/pdf" ? "swipe2work/documents" : "swipe2work/images";
}

export async function uploadMedia(request: Request, response: Response) {
  const mediaRequest = request as Request & {
    file?: {
      originalname: string;
      mimetype: string;
      buffer: Buffer;
    };
  };
  const file = mediaRequest.file;

  if (!file) {
    response.status(400).json({ message: "file is required" });
    return;
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    response.status(400).json({
      message: "Only image files (jpeg/png/webp/heic/heif) and pdf are supported",
    });
    return;
  }

  if (!hasCloudinaryCredentials()) {
    response.status(500).json({
      message:
        "Cloudinary credentials are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET",
    });
    return;
  }

  const body = request.body as { folder?: string };
  const folder = body.folder?.trim() || resolveDefaultFolder(file.mimetype);

  try {
    const result = await uploadBufferToCloudinary({
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalFilename: file.originalname,
      folder,
    });

    response.status(201).json({
      message: "Media uploaded successfully",
      file: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        secureUrl: result.secureUrl,
        publicId: result.publicId,
        resourceType: result.resourceType,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch {
    response.status(502).json({ message: "Failed to upload media to Cloudinary" });
  }
}
