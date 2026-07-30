import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
export const BUCKET = process.env.AWS_S3_BUCKET;

if (!region || !accessKeyId || !secretAccessKey || !BUCKET) {
  console.error("CRITICAL ERROR: AWS S3 environment variables are not fully defined in .env.");
  process.exit(1);
}

export const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function verifyS3Connection() {
  try {
    // Attempt a lightweight check on the specified bucket
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`AWS S3 connection verified. Bucket "${BUCKET}" is accessible.`);
  } catch (error: any) {
    console.error(`CRITICAL ERROR: AWS S3 connection validation failed for bucket "${BUCKET}".`, error);
    process.exit(1);
  }
}
