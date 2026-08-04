import Replicate from "replicate";
import cors from "cors";

const corsMiddleware = cors();

export const config = {
  maxDuration: 300,
};

export default async function handler(req, res) {
  await new Promise((resolve) => corsMiddleware(req, res, resolve));

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "YouTube URL is required" });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const prompt = `You are a viral short-form content expert. Analyze this YouTube video and suggest 5 best moments for YouTube Shorts (30-60 seconds each).

Video URL: ${url}

Return ONLY a JSON array with this exact format (no other text):
[
  {
    "title": "Catchy short title",
    "start": "MM:SS",
    "end": "MM:SS",
    "viralScore": 85,
    "reason": "Why this will go viral"
  }
]

Consider: strong hooks, emotional moments, controversial opinions, surprising facts, complete stories.`;

    const output = await replicate.run(
      "meta/meta-llama-3-70b-instruct",
      {
        input: {
          prompt: prompt,
          max_new_tokens: 2000,
          temperature: 0.7,
        }
      }
    );

    let shorts = [];
    try {
      const outputText = Array.isArray(output) ? output.join("") : output;
      const jsonMatch = outputText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        shorts = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      shorts = [{
        title: "Best Moment",
        start: "00:00",
        end: "00:45",
        viralScore: 75,
        reason: "Default suggestion"
      }];
    }

    return res.status(200).json({
      success: true,
      url: url,
      shorts: shorts
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: "Failed to process video",
      details: error.message
    });
  }
        }
