
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = '';
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/(?:GEMINI_API_KEY|API_KEY)=(.*)/);
    if (match) {
        apiKey = match[1].trim();
        if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
            apiKey = apiKey.slice(1, -1);
        }
    }
}
apiKey = apiKey.replace(/\\n/g, '');

const API_KEY = apiKey || process.env.GEMINI_API_KEY || '';

async function testGenerateImages() {
    console.log("Testing generateContent (Image) with Nano Banana Pro (gemini-3-pro-image-preview)...");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [{ role: 'user', parts: [{ text: 'A futuristic city with flying cars, cinematic lighting' }] }],
            config: {
                // @ts-ignore - responseModalities for image generation
                responseModalities: ['IMAGE'],
                // @ts-ignore - aspectRatio for image dimensions
                aspectRatio: '16:9'
            }
        });

        console.log("Response received!");
        // console.log(JSON.stringify(response, null, 2));

        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.[0];
        
        if (imagePart?.inlineData?.data) {
            console.log("SUCCESS: Image data found.");
            console.log("MimeType:", imagePart.inlineData.mimeType);
            console.log("Data length:", imagePart.inlineData.data.length);
        } else {
            console.error("FAILURE: No image data found.");
        }

    } catch (error: any) {
        console.error("ERROR GENERATING IMAGES:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Body:", await error.response.text());
        } else {
            console.error(error);
        }
    }
}

testGenerateImages();
