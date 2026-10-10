/**
 * Cloudflare R2 Storage Service for Peek & Perch
 * Handles uploading and permanent archiving of Birdfy videos (.mp4) and images (.jpg)
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'd5104a85bd311a004b05349e1937b6dd';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'peekandperch-media';
const R2_ENDPOINT = process.env.R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || R2_ENDPOINT;

let s3ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!s3ClientInstance) {
    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error('Missing R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY in environment variables.');
    }
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3ClientInstance;
}

/**
 * Builds the permanent public URL for an object key in R2
 */
export function getPermanentUrl(key: string): string {
  const cleanBase = R2_PUBLIC_URL.replace(/\/+$/, '');
  // If using r2.dev or a custom domain, the bucket name is not in the path
  if (cleanBase.includes('.r2.dev') || !cleanBase.includes('r2.cloudflarestorage.com')) {
    return `${cleanBase}/${key}`;
  }
  return `${cleanBase}/${R2_BUCKET_NAME}/${key}`;
}

/**
 * Checks whether an object key already exists in the R2 bucket
 */
export async function r2ObjectExists(key: string): Promise<boolean> {
  const client = getR2Client();
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    return false;
  }
}

/**
 * Uploads a raw buffer to R2
 */
export async function uploadBufferToR2(
  key: string,
  buffer: Buffer | Uint8Array,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return getPermanentUrl(key);
}

/**
 * Downloads media from a remote URL (e.g. temporary Netvue CDN stream/image) and uploads to R2
 */
export async function archiveUrlToR2(
  key: string,
  sourceUrl: string,
  contentType: string
): Promise<string | null> {
  try {
    // If already stored in R2, return the permanent URL immediately
    const exists = await r2ObjectExists(key);
    if (exists) {
      return getPermanentUrl(key);
    }

    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      if (response.status !== 403 && response.status !== 404) {
        console.warn(`[R2 Archiver] Failed to fetch source media: ${sourceUrl.slice(0, 70)}... (${response.status} ${response.statusText})`);
      }
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      console.warn(`[R2 Archiver] Downloaded empty buffer for ${sourceUrl}`);
      return null;
    }

    const publicUrl = await uploadBufferToR2(key, buffer, contentType);
    return publicUrl;
  } catch (err: any) {
    console.error(`[R2 Archiver] Error archiving ${sourceUrl} to R2 key ${key}:`, err.message);
    return null;
  }
}

/**
 * Archives all media (video + photos) for a single BirdSighting record to R2
 */
export async function archiveSightingMedia(sighting: any): Promise<{
  videoUrl?: string;
  imageUrl: string;
  images?: string[];
  archived: boolean;
}> {
  let modified = false;
  let videoUrl = sighting.videoUrl;
  let imageUrl = sighting.imageUrl;
  let images = Array.isArray(sighting.images) ? [...sighting.images] : [];

  const id = sighting.id || `sighting-${Date.now()}`;

  // 1. Archive Video (.mp4)
  if (videoUrl && !videoUrl.includes(R2_ACCOUNT_ID) && !videoUrl.includes('.r2.dev')) {
    const videoKey = `videos/${id}.mp4`;
    const permanentVideo = await archiveUrlToR2(videoKey, videoUrl, 'video/mp4');
    if (permanentVideo) {
      videoUrl = permanentVideo;
      modified = true;
    }
  }

  // 2. Archive Main Image (.jpg)
  if (imageUrl && !imageUrl.includes(R2_ACCOUNT_ID) && !imageUrl.includes('.r2.dev')) {
    const mainImgKey = `images/${id}_main.jpg`;
    const permanentImg = await archiveUrlToR2(mainImgKey, imageUrl, 'image/jpeg');
    if (permanentImg) {
      imageUrl = permanentImg;
      modified = true;
    }
  }

  // 3. Archive Photo Array (.jpg)
  if (images.length > 0) {
    const newImages: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img && !img.includes(R2_ACCOUNT_ID) && !img.includes('.r2.dev')) {
        const frameKey = `images/${id}_frame_${i}.jpg`;
        const permanentFrame = await archiveUrlToR2(frameKey, img, 'image/jpeg');
        newImages.push(permanentFrame || img);
        if (permanentFrame) modified = true;
      } else {
        newImages.push(img);
      }
    }
    images = newImages;
  }

  return {
    videoUrl,
    imageUrl,
    images: images.length > 0 ? images : undefined,
    archived: modified,
  };
}

