import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { z } from 'zod';
import { APIGatewayEvent, Handler } from 'aws-lambda';
import { AsciiCrawlerUtility, LoginSchema, generateResponse } from './shared';
import bcrypt from 'bcryptjs';

const asciiCrawlerUtility = new AsciiCrawlerUtility();
const dynamodb = new DynamoDBClient({ region: "us-east-2" });
const SALT_ROUNDS: number = 8;

const TABLE_NAME = process.env.TABLE_NAME;

const userExists = async (username: string): Promise<boolean> => {
  const data = await dynamodb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: { S: `USER#${username.toLowerCase()}` },
        SK: { S: "PROFILE" },
      },
    })
  );

  return !!data.Item;
};

const saveUser = async (body: z.infer<typeof LoginSchema>): Promise<boolean> => {
  const hashedPassword = bcrypt.hashSync(body.password, SALT_ROUNDS);
  return await dynamodb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: { S: `USER#${body.username.toLowerCase()}` },
        SK: { S: "PROFILE" },
        username_original: { S: body.username },
        password: { S: hashedPassword },
        role: { S: "VIEWER" },
        created_at: { N: Date.now().toString() }
      },
    })
  ).then(() => true).catch(() => false);
};

export const handler: Handler = async (event: APIGatewayEvent) => {
  const zodResult = LoginSchema.safeParse(JSON.parse(event.body || ""));
  if (zodResult.success == false)
    return generateResponse(400, { message: zodResult.error.errors.map((issue: any) => (`${issue.path.join('.')} is ${issue.message}`)) });

  try {
    if (await userExists(zodResult.data.username))
      return generateResponse(400, { message: "User already exists" });

    if (await saveUser(zodResult.data) == false)
      return generateResponse(400, { message: "Error on insert User" });

    const token = await asciiCrawlerUtility.signJWT(zodResult.data.username);
    if (token == null)
      return generateResponse(400, { message: "Error on sign JWT" });
    return generateResponse(200, { token: token }, token);
  } catch (error) {
    return generateResponse(200, { message: ["Unexpected error - DynamoDB", JSON.stringify(error)] });
  }
}