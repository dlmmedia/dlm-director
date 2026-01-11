
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
    console.log("Testing generateImages with Imagen 4.0...");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: 'A futuristic city with flying cars, cinematic lighting',
            config: {
                numberOfImages: 1
            }
        });

        console.log("Response received!");
        console.log(JSON.stringify(response, null, 2));

    } catch (error: any) {
        console.error("ERROR GENERATING IMAGES:");
        // Print full error structure
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Body:", await error.response.text());
        } else {
            console.error(error);
        }
    }
}

testGenerateImages();
