const express = require("express");
const { Client } = require("magic-hour");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: "Please enter a video prompt."
      });
    }

    const client = new Client({
      token: process.env.MAGIC_HOUR_API_KEY
    });

    const result = await client.v1.text_to_video.generate({
      end_seconds: 5,
      orientation: "landscape",
      style: {
        prompt: prompt
      },
      name: "AuthorityAI Video",
      resolution: "480p",
      wait_for_completion: true,
      download_outputs: false
    });

    res.json({
      id: result.id,
      status: result.status,
      credits_charged: result.credits_charged,
      downloads: result.downloads
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "Video generation failed."
    });
  }
});

app.listen(PORT, () => {
  console.log(`AuthorityAI is running on port ${PORT}`);
});