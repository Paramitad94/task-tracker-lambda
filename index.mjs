import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    DeleteCommand,
    ScanCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event, context) => {
    const method = event.requestContext.http.method;

    // CREATE or UPDATE (DynamoDB's PutCommand does both —
    // it overwrites if the taskId already exists)
    if (method === "POST" || method === "PUT") {
        const body = JSON.parse(event.body);
        await docClient.send(new PutCommand({
            TableName: "Tasks",
            Item: {
                taskId: body.taskId,
                title: body.title
            }
        }));
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Task saved", task: body })
        };
    }

    // DELETE
    if (method === "DELETE") {
        const body = JSON.parse(event.body);
        await docClient.send(new DeleteCommand({
            TableName: "Tasks",
            Key: { taskId: body.taskId }
        }));
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Task deleted", taskId: body.taskId })
        };
    }

    // GET — list ALL tasks if no query param, or one task if ?taskId= is given
    const taskId = event.queryStringParameters?.taskId;

    if (taskId) {
        const response = await docClient.send(new GetCommand({
            TableName: "Tasks",
            Key: { taskId }
        }));
        return {
            statusCode: 200,
            body: JSON.stringify(response.Item)
        };
    } else {
        const response = await docClient.send(new ScanCommand({
            TableName: "Tasks"
        }));
        return {
            statusCode: 200,
            body: JSON.stringify(response.Items)
        };
    }
};