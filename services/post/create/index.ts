import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AsciiCrawlerUtility, generateResponse, ProxyHandler } from './shared';
import { z } from 'zod';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from "uuid";

const asciiCrawlerUtility = new AsciiCrawlerUtility();
const s3 = new S3Client({ region: process.env.region });
const dynamo = new DynamoDBClient({ region: process.env.region });
const envSchema = z.object({
  temp_bucket_name: z.string(),
  final_bucket_name: z.string(),
  region: z.string(),

  posts_table: z.string(),
  posts_global_table: z.string()
});

const bodySchema = z.object({
  text: z.string().optional(),
  key: z.string().optional()
});

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

  if (!data.key && !data.text)
    return generateResponse(400, "error - empty body");

  try {
    if (data.key) {
      try {
        await s3.send(new GetObjectCommand({
          Bucket: envSchemaResult.data.final_bucket_name,
          Key: data.key
        }));
      } catch (error) {
        return generateResponse(500, "No such image key");
      }
    }

    const POST_UUID = uuidv4().toString();
    const timestamp = Date.now().toString();
    const metadata = {
      username_original: { S: tokenData.username },
      photo_key: { S: data.key || "" },
      text: { S: data.text || "" },
      created_at: { N: timestamp }
    };

    await dynamo.send(new PutItemCommand({
      TableName: envSchemaResult.data.posts_table,
      Item: {
        PK: { S: `USER#${tokenData.username.toLowerCase()}` },
        SK: { S: `POST#${POST_UUID}` },
        ...metadata
      }
    }));

    await dynamo.send(new PutItemCommand({
      TableName: envSchemaResult.data.posts_global_table,
      Item: {
        PK: { S: "GLOBAL#POSTS" },
        SK: { S: `POST#${POST_UUID}` },
        ...metadata
      }
    }));

    return generateResponse(200, { post_uuid: POST_UUID });
  } catch (error) {
    console.warn(error);
    return generateResponse(500, { error });
  }
}