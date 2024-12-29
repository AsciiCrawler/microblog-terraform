import { generateResponse, ProxyHandler } from './shared';
import { z } from 'zod';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { getUser } from './shared/dynamoUtils';

const dynamo = new DynamoDBClient({ region: process.env.region });
const envSchema = z.object({
  region: z.string(),
  table_users: z.string()
});

const paramsSchema = z.object({
  user: z.string()
});

export const handler: ProxyHandler = async (event) => {
  const paramsSchemaResult = paramsSchema.safeParse(event.pathParameters);
  if (!paramsSchemaResult.success)
    return generateResponse(400, { message: "No valid path param" });

  const envSchemaResult = envSchema.safeParse(process.env);
  if (!envSchemaResult.success)
    return generateResponse(500, { message: "Fail to get env variables" });

  const result = await getUser(paramsSchemaResult.data.user, dynamo, envSchemaResult.data.table_users);
  if (result.Item == null)
    return generateResponse(404, { message: "User not found" });

  {
    const { username_original, created_at, /* website, */ photo_key/* , country */ } = unmarshall(result.Item);
    return generateResponse(200, {
      user: {
        username_original, created_at, /* website, */ photo_key/* , country */
      }
    });
  }
}