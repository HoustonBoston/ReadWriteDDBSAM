/**
 * Checks if given email exists in DB
 */

import { GetItemCommand, DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { SESClient, VerifyEmailIdentityCommand } from "@aws-sdk/client-ses"

const dynamoClient = new DynamoDBClient({})
const tableName = "User"
const sesClient = new SESClient({})

export const handler = async (event, context) =>
{
    console.log('entering CheckEmailExistence')
    let userEmail = event.queryStringParameters['email']
    console.log('userEmail:', userEmail)
    const input = {
        TableName: tableName,
        Key: {
            user_email: {
                S: userEmail
            }
        }
    }

    try {
        const command = new GetItemCommand(input)
        const getRes = await dynamoClient.send(command)
        console.log("getRes.Item:", getRes.Item)

        if (getRes.Item) // if it exists don't do anything
            return {
                statusCode: 200,
                body: true
            }
        else { // otherwise send email subscription req and then put in DB
            // email sub req
            try {
                let verifyRes = sesClient.send(new VerifyEmailIdentityCommand({
                    EmailAddress: userEmail
                }))
                try {
                    const putRes = dynamoClient.send(new PutItemCommand({
                        TableName: tableName,
                        Item: {
                            user_email: { S: userEmail }
                        }
                    }))
                    console.log('putRes:', putRes)
                } catch (e) {
                    console.error('Failed to put in DDB', e)
                    return {
                        statusCode: 500,
                        body: JSON.stringify(e)
                    }
                }
                return {
                    statusCode: 200,
                    body: JSON.stringify(verifyRes)
                }
            } catch (e) {
                console.log("error when trying to send email sub req:", e)
                return {
                    statusCode: 500,
                    body: JSON.stringify(e)
                }
            }
        }
    }
    catch (e) {
        console.error("couldn't retrieve from DDB", e)
        return {
            statusCode: 500,
            body: JSON.stringify(e)
        }
    }
}