/**
 * Called during login.
 * Checks if given email exists in DB, and if it exists do nothing otherwise send subscription confirmation email.
 */

import { GetItemCommand, DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { SESClient, SendCustomVerificationEmailCommand } from "@aws-sdk/client-ses"

const dynamoClient = new DynamoDBClient({})
const tableName = "FridgeLogUser"
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
                headers: {
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                    "Access-Control-Allow-Methods": "POST, OPTIONS"
                  },
                body: true
            }
        else { // otherwise send email subscription req and then put in DB
            // email sub req
            try {
                console.log('trying to send verification email')
                let verifyRes = await sesClient.send(new SendCustomVerificationEmailCommand({
                    EmailAddress: userEmail,
                    TemplateName: "FridgeLogConfirmVerificationTemplate"
                }))
                console.log('result of email verification command', verifyRes)
                try {
                    const putRes = await dynamoClient.send(new PutItemCommand({
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
                        headers: {
                            "Access-Control-Allow-Headers": "Content-Type",
                            "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                            "Access-Control-Allow-Methods": "POST, OPTIONS"
                          },
                        body: JSON.stringify(e)
                    }
                }
                return {
                    statusCode: 200,
                    headers: {
                        "Access-Control-Allow-Headers": "Content-Type",
                        "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                        "Access-Control-Allow-Methods": "POST, OPTIONS"
                      },
                    body: JSON.stringify(verifyRes)
                }
            } catch (e) {
                console.log("error when trying to send email sub req:", e)
                return {
                    statusCode: 500,
                    headers: {
                        "Access-Control-Allow-Headers": "Content-Type",
                        "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                        "Access-Control-Allow-Methods": "POST, OPTIONS"
                      },
                    body: JSON.stringify(e)
                }
            }
        }
    }
    catch (e) {
        console.error("couldn't retrieve from DDB", e)
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                "Access-Control-Allow-Methods": "POST, OPTIONS"
              },
            body: JSON.stringify(e)
        }
    }
}