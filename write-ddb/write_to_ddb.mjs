/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */

import { v4 as uuidv4 } from "uuid"
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"

import dayjs from "dayjs" // make sure any date is a dayjs object

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"]

const client = new DynamoDBClient({})
const tableName = "FridgeLogItem"

export const handler = async (event, context) => {
  //handles cases for headers and query strings
  const date = new Date()
  var item_name, date_purchased_epoch_dayjs, expiry_date_epoch_dayjs, item_id, timestamp, userEmail

  if (event.queryStringParameters !== null) {
    item_name = event.queryStringParameters['item_name']
    date_purchased_epoch_dayjs = event.queryStringParameters['date_purchased_epoch_dayjs']
    expiry_date_epoch_dayjs = event.queryStringParameters['expiry_date_epoch_dayjs']
    item_id = event.queryStringParameters['item_id']
    timestamp = Number(event.queryStringParameters['timestamp'])
    userEmail = event.queryStringParameters['email']
  }
  else if (event.headers["Item-Name"] !== null) {
    // add more header key values if needed
    item_name = event.headers["Item-Name"]
  }
  var putOutput
  console.log('info about the items received:', 'item id', item_id, 'item name', item_name, 'date purchased', date_purchased_epoch_dayjs, 'expiry date', expiry_date_epoch_dayjs)
  console.log('type of date_purchased_epoch_dayjs', typeof (date_purchased_epoch_dayjs), 'type of expiry_date_epoch_dayjs', typeof (expiry_date_epoch_dayjs))

  try {
    console.log('trying in write_to_ddb')
    item_id = item_id || uuidv4()
    expiry_date_epoch_dayjs = (expiry_date_epoch_dayjs || dayjs().hour(12).unix())
    date_purchased_epoch_dayjs = (date_purchased_epoch_dayjs || dayjs().hour(12).unix())
    timestamp = timestamp || dayjs().unix()

    putOutput = await client.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        user_email: { "S": userEmail },
        timestamp: { "N": timestamp.toString() },
        item_id: { "S": item_id },
        item_name: { "S": item_name },
        expiry_date: { "N": expiry_date_epoch_dayjs.toString() },
        purchase_date: { "N": date_purchased_epoch_dayjs.toString() },
        date_purchased_string: { "S": `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}` }
      }
    }))

    console.log('putOutput', putOutput)
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*", // Allow from anywhere 
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: JSON.stringify(putOutput)
    }
  } catch (error) {
    console.error('catching error:', error)
    return {
      'statusCode': 500,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: JSON.stringify(error)
    }
  }
};
