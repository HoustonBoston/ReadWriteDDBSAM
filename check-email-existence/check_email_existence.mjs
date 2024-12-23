/**
 * Checks if given email exists in DB
 */

import { GetItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb"

const client = new DynamoDBClient({})
const tableName = "User"

export const handler = async (event, context) => {
    const body = typeof (event.body) === 'string' ? JSON.parse(event.body) : event.body
    let userEmail = body?.email || ""
    const input = {
        Key: {
            user_email: {
                S: userEmail
            }
        }
    }

    try {
        const command = new GetItemCommand(input)
        const res = await client.send(command)
    } catch (e) {
        console.error(e)
        return {
            statusCode: 500,
            body: JSON.stringify(e)
        }
    }
}