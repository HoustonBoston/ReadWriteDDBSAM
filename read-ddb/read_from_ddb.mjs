import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const tableName = "Item"

export const handler = async (event, context) =>
{
    try {
        console.log('trying in read_from_ddb handler')
        let output = await dynamo.send(new ScanCommand({
            TableName: tableName
        }))

        console.log('Item count', output.Count)
        return {
            "statusCode": 200,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: JSON.stringify(output)
        }

    } catch (error) {
        console.log('catching error in read_from_ddb handler', error)
        return {
            "statusCode": 500,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: JSON.stringify(event)
        }
    }
}