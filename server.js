const express = require("express");

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

    const apiKey = process.env.MAGIC_HOUR_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Magic Hour API key is not configured."
      });
    }

    const response = await fetch(
      "https://api.magichour.ai/v1/video-projects",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          name: "AuthorityAI Video",
          prompt: prompt
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || data.error || "Magic Hour request failed."
      });
    }

    res.json(data);

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