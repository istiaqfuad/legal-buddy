// S3-compatible object storage using Neon's S3 endpoint
// Uses native fetch to avoid needing the full AWS SDK in the Edge runtime.

const S3_ENDPOINT = process.env.AWS_ENDPOINT_URL_S3!;
const BUCKET = 'legalbucket';

/**
 * Returns a direct S3 upload URL for the given key.
 * For MVP: callers should use this with Authorization headers from the signed request.
 * In production: replace with @aws-sdk/s3-request-presigner.
 */
export function getUploadUrl(key: string): string {
  return `${S3_ENDPOINT}/${BUCKET}/${key}`;
}

export function getPublicUrl(key: string): string {
  return `${S3_ENDPOINT}/${BUCKET}/${key}`;
}

export const BUCKET_NAME = BUCKET;
