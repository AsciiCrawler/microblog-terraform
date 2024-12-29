import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { AsciiCrawlerUtility, generateResponse, ProxyHandler } from './shared';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const asciiCrawlerUtility = new AsciiCrawlerUtility();
const s3 = new S3Client({ region: process.env.region });
const envSchema = z.object({
  bucket_name: z.string(),
  region: z.string()
});
let env: z.infer<typeof envSchema>;

const bodySchema = z.object({
  fileName: z.string().min(4)
});

const generateSignedPostUrl = async (fileExtension: string, username: string) => {
  const key = `${username}/${uuidv4().toString()}.${fileExtension}`;
  const signedPost = await createPresignedPost(s3, {
    Bucket: env.bucket_name,
    Key: key,
    Fields: { key: key, 'Content-Type': `image/${fileExtension}` },
    Conditions: [
      ['content-length-range', 0, 5 * 1024 * 1024], // File size range
      { 'Content-Type': `image/${fileExtension}` } // Restrict to images
    ],
    Expires: 60 * 30
  });
  return signedPost;
}

const getFileExtension = (filename: string): string | null => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0)
    return null;

  const extension = filename.slice(lastDotIndex + 1).toLowerCase();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  return imageExtensions.includes(extension) ? extension : null;
}

export const handler: ProxyHandler = async (event) => {
  { // Parse ENV Variables
    const { success, data } = envSchema.safeParse(process.env);
    if (!success)
      return generateResponse(500, { message: "Fail to get env variables" });
    env = data;
  }

  // Get Userdata Cookie
  const tokenData = await asciiCrawlerUtility.getUserDataFromCookie(event.cookies);
  if (tokenData == null)
    return generateResponse(400, { message: "No JWT Cookie" });

  // Parse body
  const { success, data, error } = bodySchema.safeParse(JSON.parse(event.body || "{}"));
  if (!success)
    return generateResponse(400, { message: error.errors.map((issue: any) => (`${issue.path.join('.')} is ${issue.message}`)) });

  // Upload file
  const fileExtension = getFileExtension(data.fileName);
  if (fileExtension == null)
    return generateResponse(400, { message: "No valid file name - Must have extension" });

  return generateResponse(200, await generateSignedPostUrl(fileExtension, tokenData.username));
}