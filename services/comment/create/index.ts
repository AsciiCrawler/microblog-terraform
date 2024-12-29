import { AsciiCrawlerUtility, generateResponse, ProxyHandler } from './shared';
import { z } from 'zod';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from "uuid";

const asciiCrawlerUtility = new AsciiCrawlerUtility();
const dynamo = new DynamoDBClient({ region: process.env.region });
const envSchema = z.object({
  region: z.string(),
  comments_table: z.string(),
  global_posts_table: z.string()
});

const bodySchema = z.object({
  uuid: z.string(),
  text: z.string()
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

  try {
    const COMMENT_UUID = uuidv4().toString();
    const timestamp = Date.now().toString();

    await dynamo.send(new GetItemCommand({
      TableName: envSchemaResult.data.global_posts_table,
      Key: {
        PK: {
          S: "GLOBAL#POSTS"
        },
        SK: {
          S: `POST#${data.uuid}`
        }
      }
    }));

    await dynamo.send(new PutItemCommand({
      TableName: envSchemaResult.data.comments_table,
      Item: {
        PK: { S: `POST#${data.uuid}` },
        SK: { S: `COMMENT#${COMMENT_UUID}` },
        username_original: { S: tokenData.username },
        text: { S: data.text },
        created_at: { N: timestamp }
      }
    }));

    return generateResponse(200, { ...data });
  } catch (error) {
    console.warn(error);
    return generateResponse(500, { error });
  }
}