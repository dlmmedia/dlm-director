<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DLM Director - Elite AI Cinematic Video Agent

AI-powered film direction with character consistency, professional cinematography, and seamless scene stitching.

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with your API keys:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   BLOB_READ_WRITE_TOKEN=your_blob_token_here
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Environment Variables

### Required for Vercel Deployment

| Variable | Description | How to Get |
|----------|-------------|------------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | [Get API Key](https://aistudio.google.com/apikey) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | Vercel Dashboard → Storage → Create Blob Store |

### Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add both `GEMINI_API_KEY` and `BLOB_READ_WRITE_TOKEN`
4. Redeploy your application

## Features

- 🎬 Professional cinematography controls
- 👥 Character consistency across scenes
- 🎨 Visual style presets
- 📹 AI-powered video generation with Veo
- 🖼️ Image generation with Imagen 3
- 💾 Project persistence with Vercel Blob
