import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb"
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns"
import { SubscribeCommand } from "@aws-sdk/client-sns"

import dayjs from "dayjs"
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

const client = new DynamoDBClient({})
const tableName = "Item"
const snsClient = new SNSClient({})

/**
 * Scans entire table, stores results in a hashmap, and sends SNS notif to appropriate emails if item expiration is a day or less
 */

export const handler = async () => {
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

        items.forEach(item => {
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

        // SNS

        for (let [email, itemsArray] of expiringItemsMap) {
            console.log('items array length:', itemsArray.length)
            console.log('items array', itemsArray)
            if (itemsArray.length > 0) {
                console.log('user email in map:', email)

                let message = `Dear user,\n\n The following items are expiring soon: \n\n` +
                    itemsArray.map(item => {
                        return `-${item}\n`
                    })

                // const input = {
                //     TopicArn: "arn:aws:sns:us-east-1:986376103464:ExpiringItems",
                //     Protocol: "email",
                //     Endpoint: email,
                // }

                // try {
                //     const subRes = await snsClient.send(new SubscribeCommand(input))
                //     console.log('snsRes:', subRes)
                // } catch (error) {
                //     console.error('SNS error:', error)
                //     return {
                //         statusCode: 500,
                //         body: JSON.stringify(error)
                //     }
                // }

                // now send expiring emails
                try {
                    const pubRes = await snsClient.send(new PublishCommand({
                        Message: message,
                        TopicArn: "arn:aws:sns:us-east-1:986376103464:ExpiringItems"
                    }))

                    return {
                        statusCode: 200,
                        body: JSON.stringify(pubRes)
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