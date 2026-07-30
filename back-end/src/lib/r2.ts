import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// R2 requires access key and secret key, and the account endpoint
const endpoint = process.env.R2_ENDPOINT || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';

export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'agenda-zap-uploads';

// Initialize the S3 client pointed at Cloudflare R2
export const r2 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true, // Necessário em alguns ambientes para o R2
});

export { PutObjectCommand, GetObjectCommand, DeleteObjectCommand };
