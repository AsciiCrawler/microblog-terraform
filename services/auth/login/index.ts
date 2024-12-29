import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { AsciiCrawlerUtility, LoginSchema, ProxyHandler, generateResponse } from './shared';
import { compareSync } from 'bcryptjs';

const dynamodb = new DynamoDBClient({ region: "us-east-2" });
const asciiCrawlerUtility = new AsciiCrawlerUtility();

type TDynamoItem = {
  SK: {
    S: string
  },
  PK: {
    S: string
  },
  password: {
    S: string
  },
  username_original: {
    S: string
  },
  role: {
    S: string
  }
};

export const handler: ProxyHandler = async (event) => {
  const zodResult = LoginSchema.safeParse(JSON.parse(event.body || ""));
  if (zodResult.success == false)
    return generateResponse(400, { message: zodResult.error.errors.map((issue: any) => (`${issue.path.join('.')} is ${issue.message}`)) });

  try {
    const data = await dynamodb.send(new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        PK: {
          S: `USER#${zodResult.data.username.toLowerCase()}`
        },
        SK: {
          S: "PROFILE"
        }
      }
    }));

    const result = data.Item as TDynamoItem;
    if (data.Item == null)
      return generateResponse(404, { message: "User not found" });

    const isPasswordValid: boolean = compareSync(zodResult.data.password, result.password.S);
    if (!isPasswordValid)
      return generateResponse(400, { message: "No valid password" });

    const token = await asciiCrawlerUtility.signJWT(zodResult.data.username);
    if (token == null)
      return generateResponse(500, { message: "Error on sign token" });

    return generateResponse(200, { token: token }, token);
  } catch (error) {
    return generateResponse(500, { message: "Unexpected error - DynamoDB" });
  }
}