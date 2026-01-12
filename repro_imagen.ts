
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

async function testImagen() {
    console.log("Testing Nano Banana Pro with key length: " + API_KEY.length);
    if (!API_KEY) {
        console.error("No API Key");
        return;
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        console.log("Generating image with nano-banana-pro-preview...");
        const response = await ai.models.generateContent({
            model: 'nano-banana-pro-preview',
            contents: 'A futuristic city with flying cars, cinematic lighting',
            config: {
                responseModalities: ['IMAGE']
            }
        });

        console.log("Response received!");
        console.log(JSON.stringify(response, null, 2));

        // Simplified log to confirm success
        if (response) {
            console.log("SUCCESS: Image generated.");
        }

    } catch (error: any) {
        console.error("ERROR GENERATING IMAGE:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Body:", await error.response.text());
        } else {
            console.error(error.message || error);
        }
    }
}

testImagen();
