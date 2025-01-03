import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb"
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"

import dayjs from "dayjs"
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

const client = new DynamoDBClient({})
const tableName = "FridgeLogItem"
const sesClient = new SESClient({})

/**
 * Scans entire table, stores results in a hashmap, and sends SNS notif to appropriate emails if item expiration is a day or less
 */

export const handler = async () =>
{
    console.log('entering scan_send_notif')

    try {
        var output = await client.send(new ScanCommand({
            TableName: tableName
        }))
    } catch (error) {
        console.error(error)
        return {
            statusCode: 500,
            body: JSON.stringify("Failure in DynamoDB")
        }
    }

    dayjs.extend(utc)
    dayjs.extend(timezone)
    let currentDateDayJsUnix = dayjs().tz('America/New_York').hour(12).minute(0).second(0).millisecond(0).unix() // today at hour 12, just for consistency

    if (output) {
        console.log('scan command output', JSON.stringify(output))
        const items = output.Items
        const expiringItemsMap = new Map()

        items.forEach(item =>
        {
            console.log('item:', item)
            console.log('item.item_name', item.item_name.S)
            const userEmail = item.user_email.S
            console.log('user email:', userEmail)

            if (!expiringItemsMap.has(userEmail)) {
                console.log('expiring items map does not have email:', userEmail)
                expiringItemsMap.set(userEmail, [])
                console.log('expiring items map:', expiringItemsMap)
            }

            // all dates in DB are in unix timestamp at hour 12
            console.log('item.expiry_date.N:', item.expiry_date.N, 'currentDateDayJsUnix:', currentDateDayJsUnix, ', difference:', item.expiry_date.N - currentDateDayJsUnix)
            if (parseInt(item.expiry_date.N) - currentDateDayJsUnix <= 86400) { // if less than a day remains until expiration
                let userItemsArr = expiringItemsMap.get(userEmail) // push item to array for respective user email
                userItemsArr.push(item.item_name.S)
                expiringItemsMap.set(userEmail, userItemsArr)
                console.log('expiring items map after pushing item:', expiringItemsMap)
            }
        })

        // SES

        for (let [email, expiringItemsArray] of expiringItemsMap) {
            console.log('items array length:', expiringItemsArray.length)
            console.log('expiring items array', expiringItemsArray)
            if (expiringItemsArray.length > 0) {
                console.log('user email in map:', email)

                let message = `Dear user,\n\n The following items are expiring soon: \n\n` +
                    expiringItemsArray.map(item => `-${item}`).join('\n')
                const snsInput = {
                    Source: "myhorsefly12345@gmail.com",
                    Destination: {
                        ToAddresses: [email]
                    },
                    Message: {
                        Body: {
                            Text: {
                                Data: message,
                                Charset: "UTF-8"
                            }
                        },
                        Subject: {
                            Charset: "UTF-8",
                            Data: "Expiring Items"
                        }
                    }
                }

                // now send expiring emails
                try {
                    const emailRes = await sesClient.send(new SendEmailCommand(snsInput))

                    return {
                        statusCode: 200,
                        body: JSON.stringify(emailRes)
                    }
                } catch (error) {
                    console.error('SNS error:', error)
                    return {
                        statusCode: 500,
                        body: JSON.stringify(error)
                    }
                }
            }
        }
    }

}