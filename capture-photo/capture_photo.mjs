import { RekognitionClient, DetectTextCommand } from "@aws-sdk/client-rekognition"

const client = new RekognitionClient({})

export const handler = async (event) =>
{
    console.log('entering capture photo lambda function')
    const body = typeof (event.body) === 'string' ? JSON.parse(event.body) : event.body

    let image = body?.base64Image || "" //image is a base64 encoded string

    if (image) {
        console.log('info about image', image.substring(0, 24))
        console.log('base64 image size', image.length)
        if (image.charAt(22) === ",") {
            image = image.substring(23)
        }
        else if (image.charAt(21) === ",")
            image = image.substring(22)
    }

    const input = {
        Image: {
            Bytes: Buffer.from(image, 'base64')
        },
        Filters: {
            WordFilter: {
                MinConfidence: 85
            }
        }
    }
    try {
        console.log('trying in capture photo lambda')
        if (image) {
            console.log('inside if (image)')
            console.log('calling detect text API')
            const command = new DetectTextCommand(input)
            var response = await client.send(command)
            console.log('response from detect text command:', JSON.stringify(response))
        }
        if (response) {
            return {
                statusCode: 200,
                body: JSON.stringify(response),
                headers: {
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                    "Access-Control-Allow-Methods": "POST, OPTIONS"
                }
            }
        }
        else {
            return {
                statusCode: 500,
                body: "Unable to detect text",
                headers: {
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                    "Access-Control-Allow-Methods": "POST, OPTIONS"
                }
            }
        }
    } catch (error) {
        console.error('error from capture_photo', error)
        return {
            statusCode: 500,
            body: JSON.stringify(error),
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            }
        }
    }



}