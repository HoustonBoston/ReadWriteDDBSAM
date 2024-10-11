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

import {v4 as uuidv4} from "uuid"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import
{
  DynamoDBDocumentClient,
  PutCommand
} from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const tableName = "Item"

export const handler = async (event, context) =>
{
  console.log('event query string:', event.queryStringParameters, 'method', event.httpMethod)

  try {
    let putOutput = await dynamo.send(new PutCommand({
      TableName: tableName,
      Item: {
        item_id: uuidv4(),
        item_name: event.queryStringParameters['item_name']
      }
    }))

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
