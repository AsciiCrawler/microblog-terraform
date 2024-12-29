import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AsciiCrawlerUtility, ProxyHandler, generateResponse } from './shared';
import { z } from 'zod';

const dynamodb = new DynamoDBClient({ region: process.env.region });
const s3 = new S3Client({ region: process.env.region });
const asciiCrawlerUtility = new AsciiCrawlerUtility();

export const bodySchema = z.object({
  photo_key: z.string().optional(),
  // country: z.string().optional(),
  // website: z.string().optional()
});

const envSchema = z.object({
  final_bucket_name: z.string(),
  region: z.string(),
  users_table: z.string()
});

export const handler: ProxyHandler = async (event) => {
  const envSchemaResult = envSchema.safeParse(process.env);
  if (!envSchemaResult.success)
    return generateResponse(500, { message: "Fail to get env variables" });

  const bodySchemaResult = bodySchema.safeParse(JSON.parse(event.body || ""));
  if (bodySchemaResult.success == false)
    return generateResponse(400, { message: bodySchemaResult.error.errors.map((issue: any) => (`${issue.path.join('.')} is ${issue.message}`)) });

  const userData = await asciiCrawlerUtility.getUserDataFromCookie(event.cookies);
  if (!userData)
    return generateResponse(401, { message: "Unauthorized" });

  if (bodySchemaResult.data.photo_key && !bodySchemaResult.data.photo_key.toLowerCase().startsWith(userData.username.toLowerCase() + "/"))
    return generateResponse(401, { message: "No valid photo - Unauthorized", a: bodySchemaResult.data.photo_key.toLowerCase(), b: userData.username.toLowerCase() + "/" });

  try {
    if (bodySchemaResult.data.photo_key && bodySchemaResult.data.photo_key.length > 4)
      await s3.send(new GetObjectCommand({
        Bucket: envSchemaResult.data.final_bucket_name,
        Key: bodySchemaResult.data.photo_key
      }));
  } catch (error) {
    return generateResponse(404, { message: "Photo not found - Internal error" });
  }

  try {
    {
      const data = await dynamodb.send(new GetItemCommand({
        TableName: envSchemaResult.data.users_table,
        ConsistentRead: true,
        Key: {
          PK: {
            S: `USER#${userData.username.toLowerCase()}`
          },
          SK: {
            S: "PROFILE"
          }
        }
      }));

      if (data.Item == null)
        return generateResponse(404, { message: "User not found" });
    }

    await dynamodb.send(new UpdateItemCommand({
      TableName: envSchemaResult.data.users_table,
      Key: {
        PK: {
          S: `USER#${userData.username.toLowerCase()}`
        },
        SK: {
          S: "PROFILE"
        }
      },
      AttributeUpdates: {
        photo_key: {
          Action: "PUT",
          Value: {
            S: bodySchemaResult.data.photo_key || ""
          }
        },
        // country: {
        //   Action: "PUT",
        //   Value: {
        //     S: bodySchemaResult.data.country || ""
        //   }
        // },
        // website: {
        //   Action: "PUT",
        //   Value: {
        //     S: bodySchemaResult.data.website || ""
        //   }
        // }
      }
    }));

    return generateResponse(200, { message: "User updated" });
  } catch (error) {
    return generateResponse(500, { message: "Unexpected error", test: error });
  }
}