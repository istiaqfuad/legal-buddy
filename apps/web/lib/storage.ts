import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

export const BUCKET_NAME = process.env.NEON_STORAGE_BUCKET ?? 'legalbucket';
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

let client: S3Client | null = null;

export function isStorageConfigured(): boolean {
  return Boolean(endpoint && region && accessKeyId && secretAccessKey);
}

function getClient(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error('Neon Object Storage is not configured. Set the AWS_* storage variables.');
  }
  if (!client) {
    client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
      forcePathStyle: true,
      // Presigned PUTs must not carry a checksum computed from an empty body.
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });
  }
  return client;
}

export function buildStorageKey(userId: string, filename: string): string {
  const safeName = filename
    .normalize('NFKD')
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(-120);
  return `users/${userId}/documents/${crypto.randomUUID()}-${safeName || 'document'}`;
}

export async function uploadObject(input: {
  key: string;
  body: Uint8Array;
  contentType: string;
}) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
}

export async function deleteObject(key: string) {
  await getClient().send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
}

export async function createDownloadUrl(key: string, filename: string, expiresIn = 300) {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename.replace(/["\\\r\n]/g, '')}"`,
    }),
    { expiresIn },
  );
}
