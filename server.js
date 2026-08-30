const express = require("express");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.static(__dirname));

app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

app.post("/api/generate", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please upload an image."
      });
    }

    const prompt = req.body.prompt || "A cinematic animation";

    const imageBuffer = fs.readFileSync(req.file.path);

    const form = new FormData();

    form.append(
      "image",
      new Blob([imageBuffer], { type: req.file.mimetype }),
      req.file.originalname
    );

    const uploadResponse = await fetch(
      "https://api.magichour.ai/v1/assets",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.MAGIC_HOUR_API_KEY}`
        },
        body: form
      }
    );

    const uploadData = await uploadResponse.json();

    fs.unlinkSync(req.file.path);

    if (!uploadResponse.ok) {
      return res.status(uploadResponse.status).json(uploadData);
    }

    const imagePath =
      uploadData.path ||
      uploadData.file_path ||
      uploadData.id;

    const videoResponse = await fetch(
      "https://api.magichour.ai/v1/image-to-video",
      {
        method: "POST",
        headers: {
          "accept": "application/json",
          "authorization": `Bearer ${process.env.MAGIC_HOUR_API_KEY}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name: "AuthorityAI Video",
          end_seconds: 5,
          model: "kling-3.0",
          resolution: "720p",
          audio: true,
          style: {
            prompt: prompt
          },
          assets: {
            image_file_path: imagePath
          }
        })
      }
    );

    const videoData = await videoResponse.json();

    if (!videoResponse.ok) {
      return res.status(videoResponse.status).json(videoData);
    }

    res.json(videoData);

  } catch (error) {
    console.error(error);

    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }

    res.status(500).json({
      error: error.message || "Video generation failed."
    });
  }
});

app.listen(PORT, () => {
  console.log(`AuthorityAI is running on port ${PORT}`);
});