
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "test" });

console.log("Keys on ai instance:", Object.keys(ai));
console.log("Keys on ai.models:", Object.keys(ai.models));
// Check prototype of ai.models to see methods
console.log("Methods on ai.models:", Object.getOwnPropertyNames(Object.getPrototypeOf(ai.models)));

// Check if there is a 'predict' method
// @ts-ignore
if (ai.models.predict) console.log("Has ai.models.predict");
// @ts-ignore
if (ai.models.generateImages) console.log("Has ai.models.generateImages");
