const Replicate = require("replicate");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body || {};

    if (!url) {
      return res.status(400).json({ error: "YouTube URL is required" });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ error: "REPLICATE_API_TOKEN missing" });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const prompt = `Suggest 5 viral YouTube Shorts moments from this video URL: ${url}

Return ONLY valid JSON array, no extra text:
[
  {
    "title": "catchy title",
    "start": "00:30",
    "end": "01:00",
    "viralScore": 85,
    "reason": "why it can go viral"
  }
]`;

    const output = await replicate.run(
      "meta/meta-llama-3-8b-instruct",
      {
        input: {
          prompt: prompt,
          max_tokens: 800,
          temperature: 0.7,
        },
      }
    );

    let text = "";
    if (Array.isArray(output)) text = output.join("");
    else if (typeof output === "string") text = output;
    else text = JSON.stringify(output);

    let shorts = [];
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      shorts = JSON.parse(match[0]);
    } else {
      shorts = [
        {
          title: "أقوى لحظة في البداية",
          start: "00:00",
          end: "00:45",
          viralScore: 82,
          reason: "البداية غالبًا فيها Hook قوي يجذب المشاهد",
        },
        {
          title: "المعلومة المفاجئة",
          start: "01:00",
          end: "01:40",
          viralScore: 78,
          reason: "المفاجآت بترفع معدل المشاهدة",
        },
        {
          title: "الخلاصة السريعة",
          start: "02:00",
          end: "02:35",
          viralScore: 74,
          reason: "الملخصات بتتنشر كويس على الشورتس",
        },
      ];
    }

    return res.status(200).json({
      success: true,
      url,
      shorts,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to process video",
    });
  }
};
