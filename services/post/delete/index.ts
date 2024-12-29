import { AsciiCrawlerUtility, generateResponse, ProxyHandler } from './shared';
import { z } from 'zod';
import { DeleteItemCommand, DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const asciiCrawlerUtility = new AsciiCrawlerUtility();
const dynamo = new DynamoDBClient({ region: process.env.region });
const envSchema = z.object({
  temp_bucket_name: z.string(),
  final_bucket_name: z.string(),
  region: z.string(),

  posts_table: z.string(),
  posts_global_table: z.string()
});

const paramsSchema = z.object({
  uuid: z.string()
});

export const handler: ProxyHandler = async (event) => {
  // Get Env variables
  const envSchemaResult = envSchema.safeParse(process.env);
  if (!envSchemaResult.success)
    return generateResponse(500, { message: "Fail to get env variables" });

  // Get params
  const paramsSchemaResult = paramsSchema.safeParse(event.pathParameters);
  if (!paramsSchemaResult.success)
    return generateResponse(400, { message: "No valid path param" });

  // Get Userdata Cookie
  const userData = await asciiCrawlerUtility.getUserDataFromCookie(event.cookies);
  if (userData == null)
    return generateResponse(400, { message: "No JWT Cookie" });

  try {
    const result = await dynamo.send(new GetItemCommand({
      TableName: envSchemaResult.data.posts_table,
      Key: {
        PK: {
          S: `USER#${userData.username.toLowerCase()}`
        },
        SK: {
          S: `POST#${paramsSchemaResult.data.uuid}`
        }
      }
    }));

    if (!result.Item)
      return generateResponse(404, { message: "Post not found" });

    await dynamo.send(new DeleteItemCommand({
      TableName: envSchemaResult.data.posts_table,
      Key: {
        PK: {
          S: `USER#${userData.username.toLowerCase()}`
        },
        SK: {
          S: `POST#${paramsSchemaResult.data.uuid}`
        }
      }
    }));

    await dynamo.send(new DeleteItemCommand({
      TableName: envSchemaResult.data.posts_global_table,
      Key: {
        PK: {
          S: `GLOBAL#POSTS`
        },
        SK: {
          S: `POST#${paramsSchemaResult.data.uuid}`
        }
      }
    }));

    return generateResponse(200, { message: "Post deleted" });
  } catch (error) {
    console.warn(error);
    return generateResponse(500, { error });
  }
}