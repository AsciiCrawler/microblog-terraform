import { DeleteObjectCommand, GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AsciiCrawlerUtility, generateResponse, ProxyHandler } from './shared';
import { z } from 'zod';
import sharp from 'sharp';

const asciiCrawlerUtility = new AsciiCrawlerUtility();
const s3 = new S3Client({ region: process.env.region });
const envSchema = z.object({
  temp_bucket_name: z.string(),
  final_bucket_name: z.string(),
  region: z.string()
});

const bodySchema = z.object({
  key: z.string()
});

interface IResponse {
  key: string | null;
}

const removeFileExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return fileName; // No extension found
  return fileName.substring(0, lastDotIndex);
}

export const handler: ProxyHandler = async (event) => {
  const envSchemaResult = envSchema.safeParse(process.env);
  if (!envSchemaResult.success)
    return generateResponse(500, { message: "Fail to get env variables" });

  // Get Userdata Cookie
  const tokenData = await asciiCrawlerUtility.getUserDataFromCookie(event.cookies);
  if (tokenData == null)
    return generateResponse(400, { message: "No JWT Cookie" });

  // Parse body
  const { success, data, error } = bodySchema.safeParse(JSON.parse(event.body || "{}"));
  if (!success)
    return generateResponse(400, { message: error.errors.map((issue: any) => (`${issue.path.join('.')} is ${issue.message}`)) });

  try {
    const response: IResponse = {
      key: null,
    };

    // Upload image if Key Exists
    let s3Object: GetObjectCommandOutput;
    try {
      s3Object = await s3.send(new GetObjectCommand({
        Bucket: envSchemaResult.data.temp_bucket_name,
        Key: data.key
      }));
    } catch (error) {
      return generateResponse(500, error);
    }

    if (!s3Object.Body)
      return generateResponse(500, { message: "no body - empty s3 object" });

    const sharped = await sharp(await s3Object.Body.transformToByteArray()).resize({ width: 1024, height: 1024 }).webp({
      quality: 80
    }).toBuffer();

    try {
      response.key = `${removeFileExtension(data.key)}.webp`
      await s3.send(new PutObjectCommand({
        Bucket: envSchemaResult.data.final_bucket_name,
        Key: response.key,
        Body: sharped,
        ContentType: "image/webp",
        ContentLength: sharped.byteLength
      }))
    } catch (error) {
      return generateResponse(500, error);
    }

    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: envSchemaResult.data.temp_bucket_name,
        Key: data.key
      }));
    } catch (error) {
      console.warn({ message: error });
    }

    return generateResponse(200, { ...response });
  } catch (error) {
    console.warn(error);
    return generateResponse(500, { error });
  }
}