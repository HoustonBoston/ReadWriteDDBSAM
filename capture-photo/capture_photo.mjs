

export const handler = async (event) =>
{
    console.log('entering capture photo lambda function')
    const body = JSON.parse(event.body)

    const image = body?.base64Image || ""

    return {
        statusCode: 200,
        body: "capture photo lambda function OK status code",
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*", // Allow from anywhere 
            "Access-Control-Allow-Methods": "POST, OPTIONS"
        }
    }
}