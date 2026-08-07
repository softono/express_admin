import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import config from "@/config";
import { getFilePath } from "../path";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: config.AWS_REGION,
      endpoint: config.AWS_ENDPOINT || undefined,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      },
      forcePathStyle: !!config.AWS_ENDPOINT,
    });
  }
  return s3Client;
}

export async function uploadS3(
  buffer: Buffer,
  relativePath: string,
  type = "profile",
): Promise<void> {
  const key = getFilePath(type) + relativePath;
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: config.AWS_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
    }),
  );
}

export async function deleteS3(
  file_name: string,
  type = "profile",
): Promise<void> {
  const key = getFilePath(type) + file_name;
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: config.AWS_BUCKET,
      Key: key,
    }),
  );
}

export async function uploadPrivateS3(
  buffer: Buffer,
  relativePath: string,
  type = "profile",
): Promise<void> {
  const key = getFilePath(type) + relativePath;
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: config.AWS_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
      ACL: "private",
    }),
  );
}

export async function getS3PresignedUrl(
  file_name: string,
  type = "profile",
  expiresIn = 3600,
): Promise<string> {
  const key = getFilePath(type) + file_name;
  const command = new GetObjectCommand({
    Bucket: config.AWS_BUCKET,
    Key: key,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn });
}
