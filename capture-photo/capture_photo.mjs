import { vl } from "moondream"

const model = new vl({
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlfaWQiOiJlMWNiMzhiMi1mMWQxLTRlYjctOGMzYS02MWNhOTViNmZhMGQiLCJpYXQiOjE3MzcxMzc4OTR9.BI0FT3zvPi_aXXbePnj_K05P8j2WR1_hQ7mTmhoAaLo"
})

export const handler = async (event) => {
    console.log('entering capture photo lambda function')
    const body = typeof (event.body) === 'string' ? JSON.parse(event.body) : event.body

    let image = body?.base64Image || "" //image is a base64 encoded string

    try {
        const response = await model.query({
            image: image,
            question: "What is the expiry date on this object?"
        })

        console.log('answer:', response)

        return {
            statusCode: 200,
            body: JSON.stringify(response),
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            }
        }
    } catch (e) {
        console.error('error when calling moondream:', e)

        return {
            statusCode: 200,
            body: JSON.stringify(e),
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*", // Allow from anywhere 
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            }
        }
    }
}