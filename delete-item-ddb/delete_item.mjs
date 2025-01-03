import {
    DynamoDBClient,
    DeleteItemCommand
} from "@aws-sdk/client-dynamodb"

const client = new DynamoDBClient({})

export const handler = async (event, context) => {
    console.log('event path params', event.pathParameters)
    console.log('email', event.pathParameters.email)
    const email = event.pathParameters.email
    const tableName = "FridgeLogItem"
    const timestamp = event.queryStringParameters['timestamp']
    console.log('email', email)

    try {
        const deleteOutput = await client.send(new DeleteItemCommand(
            {
                TableName: tableName,
                Key: {
                    user_email: { "S": email },
                    timestamp: { "N": timestamp }
                }
            }
        ))

        return {
            statusCode: 200,
            body: JSON.stringify(deleteOutput),
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            }
        }
    } catch (error) {
        console.log(error)
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: JSON.stringify(error)
        }
    }
}