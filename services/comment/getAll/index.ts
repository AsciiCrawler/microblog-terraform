import { generateResponse, ProxyHandler, safeJsonParse } from './shared';
import { z } from 'zod';
import { AttributeValue, DynamoDBClient, QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { getUser } from './shared/dynamoUtils';

const dynamo = new DynamoDBClient({ region: process.env.region });
const envSchema = z.object({
  region: z.string(),
  comments_table: z.string(),
  users_table: z.string()
});

const LastEvaluatedKeySchema = z.object({
  PK: z.object({
    S: z.string()
  }),
  SK: z.object({
    S: z.string()
  }),
  created_at: z.object({
    N: z.string()
  })
});

const user_cache_pool: Map<string, { username_original: string } | null> = new Map();
const getUserCache = async (username: string, table_users: string) => {
  const data = user_cache_pool.get(username.toLowerCase());
  if (data)
    return data;

  const result = await getUser(username, dynamo, table_users);
  if (!result.Item) {
    user_cache_pool.set(username.toLowerCase(), null);
    return null;
  }

  const { username_original, photo_key } = unmarshall(result.Item);
  const _data = { username_original, photo_key };
  user_cache_pool.set(username.toLowerCase(), _data);
  return _data;
}

export const handler: ProxyHandler = async (event) => {
  // Parse Env
  const envSchemaResult = envSchema.safeParse(process.env);
  if (!envSchemaResult.success)
    return generateResponse(500, { message: "Fail to get env variables" });

  const uuidParam = event.pathParameters?.uuid;

  let _ExclusiveStartKey: any | null = null;
  if (event.queryStringParameters?.LastEvaluatedKey) {
    const LastEvaluatedKey_SafeJsonParse = safeJsonParse(event.queryStringParameters?.LastEvaluatedKey || "");
    if (LastEvaluatedKey_SafeJsonParse == null)
      return generateResponse(400, { message: "no valid query format" });

    const LastEvaluatedKeyResult = LastEvaluatedKeySchema.safeParse(LastEvaluatedKey_SafeJsonParse);
    if (LastEvaluatedKeyResult.success == false)
      return generateResponse(400, { message: "no valid query zod" });
    _ExclusiveStartKey = LastEvaluatedKeyResult.data;
  }

  try {
    let params: QueryCommandInput = {
      TableName: envSchemaResult.data.comments_table,
      IndexName: "CreatedAtIndex",
      KeyConditionExpression: "#pk = :pkValue",
      ExpressionAttributeNames: {
        "#pk": "PK",
      },
      ExpressionAttributeValues: {
        ":pkValue": {
          S: `POST#${uuidParam}`
        },
      },
      Limit: 10,
      ScanIndexForward: false
    };

    if (_ExclusiveStartKey)
      params = { ...params, ExclusiveStartKey: _ExclusiveStartKey }

    const result = await dynamo.send(new QueryCommand(params));
    if (result.Items == null || result.Items.length == 0)
      return generateResponse(200, { LastEvaluatedKey: null, Items: [] });

    return generateResponse(200, {
      LastEvaluatedKey: result.LastEvaluatedKey || null,
      Items: await Promise.all(
        result.Items.map(async (e: Record<string, AttributeValue>) => {
          const { text, created_at, username_original, SK } = unmarshall(e);
          const user = await getUserCache(username_original, envSchemaResult.data.users_table);
          return { text, created_at, SK, user };
        })
      )
    });
  } catch (error) {
    console.error('Error querying GSI:', error);
    return generateResponse(500, { error });
  }
}