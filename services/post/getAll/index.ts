import { generateResponse, ProxyHandler, safeJsonParse } from './shared';
import { z } from 'zod';
import { AttributeValue, DynamoDBClient, GetItemCommand, QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { getUser } from './shared/dynamoUtils';

const dynamo = new DynamoDBClient({ region: process.env.region });
const envSchema = z.object({
  region: z.string(),
  table_global_posts: z.string(),
  table_posts: z.string(),
  table_users: z.string()
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

const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

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
  const userParam = event.pathParameters?.user;

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
    // Get UUID Post
    if (userParam && isUUID(userParam)) {
      const result = await dynamo.send(new GetItemCommand({
        TableName: envSchemaResult.data.table_global_posts,
        Key: {
          PK: { S: `GLOBAL#POSTS` },
          SK: { S: `POST#${userParam}` }
        }
      }))

      const _Items: any[] = [];
      if (result.Item) {
        const { photo_key, text, created_at, username_original, SK } = unmarshall(result.Item);
        const user = await getUserCache(username_original, envSchemaResult.data.table_users);
        _Items.push({ photo_key, text, created_at, SK, user });
      }

      return generateResponse(200, {
        LastEvaluatedKey: null,
        Items: _Items
      });
    }

    let params: QueryCommandInput;
    // Get all by User
    if (userParam) {
      params = {
        TableName: envSchemaResult.data.table_posts,
        IndexName: "CreatedAtIndex",
        KeyConditionExpression: "#pk = :pkValue",
        ExpressionAttributeNames: {
          "#pk": "PK",
        },
        ExpressionAttributeValues: {
          ":pkValue": {
            S: `USER#${userParam.toLowerCase()}`
          },
        },
        Limit: 10,
        ScanIndexForward: false
      };
    } else {
      // Default get all
      params = {
        TableName: envSchemaResult.data.table_global_posts,
        IndexName: "CreatedAtIndex",
        KeyConditionExpression: "#pk = :pkValue",
        ExpressionAttributeNames: {
          "#pk": "PK",
        },
        ExpressionAttributeValues: {
          ":pkValue": {
            S: "GLOBAL#POSTS"
          },
        },
        Limit: 10,
        ScanIndexForward: false
      };
    }

    if (_ExclusiveStartKey)
      params = { ...params, ExclusiveStartKey: _ExclusiveStartKey }

    const result = await dynamo.send(new QueryCommand(params));
    if (result.Items == null || result.Items.length == 0)
      return generateResponse(200, { LastEvaluatedKey: null, Items: [] });

    return generateResponse(200, {
      LastEvaluatedKey: result.LastEvaluatedKey || null,
      Items: await Promise.all(
        result.Items.map(async (e: Record<string, AttributeValue>) => {
          const { photo_key, text, created_at, username_original, SK } = unmarshall(e);
          const user = await getUserCache(username_original, envSchemaResult.data.table_users);
          return { photo_key, text, created_at, SK, user };
        })
      )
    });
  } catch (error) {
    console.error('Error querying GSI:', error);
    return generateResponse(500, { error });
  }
}