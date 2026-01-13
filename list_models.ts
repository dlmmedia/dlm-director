
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

async function listModels() {
    console.log("Listing models...");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const response = await ai.models.list();
        console.log("Full Response:", JSON.stringify(response, null, 2));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
