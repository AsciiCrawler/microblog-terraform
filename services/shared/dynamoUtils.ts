import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
export const getUser = async (username: string, dynamo: DynamoDBClient, tableName: string) => {
    return await dynamo.send(new GetItemCommand({
        TableName: tableName,
        Key: {
            PK: { S: `USER#${username.toLowerCase()}` },
            SK: { S: "PROFILE" }
        }
    }));
}