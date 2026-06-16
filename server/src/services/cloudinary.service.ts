import {
  v2 as cloudinary,
  type UploadApiErrorResponse,
  type UploadApiResponse,
} from "cloudinary";

type UploadBufferInput = {
  buffer: Buffer;
  mimeType: string;
  originalFilename: string;
  folder?: string;
};

type UploadResult = {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format?: string;
  bytes?: number;
};

let configured = false;

function getCloudinaryConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };
}

export function hasCloudinaryCredentials() {
  const config = getCloudinaryConfig();
  return Boolean(config.cloudName && config.apiKey && config.apiSecret);
}

function ensureCloudinaryConfigured() {
  if (configured) {
    return;
  }

  const config = getCloudinaryConfig();

  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET");
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  configured = true;
}

function resolveResourceType(mimeType: string) {
  return mimeType === "application/pdf" ? "raw" : "image";
}

export async function uploadBufferToCloudinary({
  buffer,
  mimeType,
  originalFilename,
  folder,
}: UploadBufferInput): Promise<UploadResult> {
  ensureCloudinaryConfigured();

  const resourceType = resolveResourceType(mimeType);

  return await new Promise<UploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder,
        use_filename: true,
        unique_filename: true,
        filename_override: originalFilename,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url || !result.public_id || !result.resource_type) {
          reject(new Error("Cloudinary upload did not return expected response"));
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );

    uploadStream.end(buffer);
  });
}
