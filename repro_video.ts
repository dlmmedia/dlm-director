
import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

if (!API_KEY) {
    console.error("Error: GEMINI_API_KEY or API_KEY env var must be set.");
    process.exit(1);
}

// Sanitize key like the service does
const sanitizedKey = API_KEY.trim().replace(/\\n/g, '');
const ai = new GoogleGenAI({ apiKey: sanitizedKey });

async function run() {
    console.log("Starting video generation reproduction...");

    // Try Veo 3.1 as requested
    const modelName = 'veo-3.1-generate-preview';
    // const modelName = 'veo-2.0-generate-001';

    console.log(`Using model: ${modelName}`);

    // Read a real image
    const imagePath = path.join(process.cwd(), 'node_modules/undici/docs/assets/lifecycle-diagram.png');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    try {
        console.log("Sending request...");
        let operation = await ai.models.generateVideos({
            model: modelName,
            prompt: "A cinematic shot of a futuristic city at sunset, 4k, realistic",
            image: {
                imageBytes: base64Image,
                mimeType: 'image/png',
            },
            config: {
                numberOfVideos: 1,
                // durationSeconds: 5,
                aspectRatio: '16:9'
            }
        });

        console.log("Request sent. Operation:", JSON.stringify(operation, null, 2));

        // Polling
        while (!operation.done) {
            console.log("Polling...");
            await new Promise(r => setTimeout(r, 5000));
            // @ts-ignore
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        console.log("Process complete. Result:", JSON.stringify(operation, null, 2));

    } catch (error: any) {
        console.error("Caught error:");
        // Log detailed error info
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error);
        }
    }
}

run();
