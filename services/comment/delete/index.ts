import { AsciiCrawlerUtility, generateResponse, ProxyHandler } from './shared';
import { z } from 'zod';
import { DeleteItemCommand, DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const asciiCrawlerUtility = new AsciiCrawlerUtility();
const dynamo = new DynamoDBClient({ region: process.env.region });
const envSchema = z.object({
  region: z.string(),
  comments_table: z.string()
});

const bodySchema = z.object({
  uuid_post: z.string(),
  uuid_comment: z.string()
});

export const handler: ProxyHandler = async (event) => {
  const post_uuid = event.pathParameters?.post_uuid || null;
  const comment_uuid = event.pathParameters?.comment_uuid || null;
  if (!post_uuid || !comment_uuid) 
    return generateResponse(400, { message: "No post_uuid or comment_uuid" });

  // Get Env variables
  const envSchemaResult = envSchema.safeParse(process.env);
  if (!envSchemaResult.success)
    return generateResponse(500, { message: "Fail to get env variables", errors: envSchemaResult.error.errors.map((issue: any) => (`${issue.path.join('.')} is ${issue.message}`)) });

  // Get Userdata Cookie
  const userData = await asciiCrawlerUtility.getUserDataFromCookie(event.cookies);
  if (userData == null)
    return generateResponse(400, { message: "No JWT Cookie" });

  try {
    const result = await dynamo.send(new GetItemCommand({
      TableName: envSchemaResult.data.comments_table,
      Key: {
        PK: {
          S: `POST#${post_uuid.toLowerCase()}`
        },
        SK: {
          S: `COMMENT#${comment_uuid.toLowerCase()}`
        }
      }
    }));

    if (!result.Item)
      return generateResponse(404, { message: "Post not found" });

    {
      const { username_original } = unmarshall(result.Item) as { username_original: string };
      if (username_original.toLowerCase() != userData.username.toLowerCase())
        return generateResponse(401, { message: "Unauthorized" });
    }

    await dynamo.send(new DeleteItemCommand({
      TableName: envSchemaResult.data.comments_table,
      Key: {
        PK: {
          S: `POST#${post_uuid.toLowerCase()}`
        },
        SK: {
          S: `COMMENT#${comment_uuid.toLowerCase()}`
        }
      }
    }));

    return generateResponse(200, { message: "Comment deleted" });
  } catch (error) {
    console.warn(error);
    return generateResponse(500, { error });
  }
}