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
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand
} from "@aws-sdk/lib-dynamodb"

import dayjs, { unix } from 'dayjs' // make sure any date is a dayjs object

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"]

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const tableName = "Item"

export const handler = async (event, context) => {

  //handles cases for headers and query strings
  const date = new Date()
  var item_name, date_purchased_epoch_dayjs, expiry_date_epoch_dayjs, item_id

  if (event.queryStringParameters !== null) {
    item_name = event.queryStringParameters['item_name']
    date_purchased_epoch_dayjs = event.queryStringParameters['date_purchased_epoch_dayjs']
    expiry_date_epoch_dayjs = event.queryStringParameters['expiry_date_epoch_dayjs']
    item_id = event.queryStringParameters['item_id']
  }
  else if (event.headers["Item-Name"] !== null) {
    // add more header key values if needed
    item_name = event.headers["Item-Name"]
  }

  try {
    if (item_id !== null) { // if item already exists
      var putOutput = await dynamo.send(new PutCommand({
        TableName: tableName,
        Item: {
          item_id: item_id,
          item_name: item_name,
          expiry_date: expiry_date_epoch_dayjs,
          date_purchased_epoch_dayjs: date_purchased_epoch_dayjs,
          date_purchased_string: `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
        }
      }))
    } else { //make new item with
      date_purchased_epoch_dayjs = dayjs().hour(12)
      expiry_date_epoch_dayjs = dayjs().hour(12)

      putOutput = await dynamo.send(new PutCommand({
        TableName: tableName,
        Item: {
          item_id: uuidv4(),
          item_name: item_name,
          expiry_date: expiry_date_epoch_dayjs,
          date_purchased_epoch_dayjs: date_purchased_epoch_dayjs,
          date_purchased_string: `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
        }
      }))
    }

    return {
      statusCode: 200,
      body: JSON.stringify(putOutput)
    }
  } catch (error) {
    console.error('catching error:', error)
    return {
      'statusCode': 500, body: JSON.stringify(error)
    }
  }
};
