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
  let localFile;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please upload an image."
      });
    }

    localFile = req.file.path;

    const prompt =
      req.body.prompt || "A cinematic animation with smooth camera movement";

    const extension =
      req.file.originalname.split(".").pop().toLowerCase();

    // 1. Get an upload URL from Magic Hour
    const uploadUrlResponse = await fetch(
      "https://api.magichour.ai/v1/files/upload-urls",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.MAGIC_HOUR_API_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          items: [
            {
              type: "image",
              extension: extension
            }
          ]
        })
      }
    );

    const uploadUrlData = await uploadUrlResponse.json();

    if (!uploadUrlResponse.ok) {
      throw new Error(
        uploadUrlData.message ||
        uploadUrlData.error ||
        "Could not get Magic Hour upload URL."
      );
    }

    const asset = uploadUrlData.items[0];

    // 2. Upload the selected image
    const imageBuffer = fs.readFileSync(localFile);

    const fileUploadResponse = await fetch(asset.upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": req.file.mimetype
      },
      body: imageBuffer
    });

    if (!fileUploadResponse.ok) {
      throw new Error("Could not upload image to Magic Hour.");
    }

    // 3. Create the Image-to-Video project
    const videoResponse = await fetch(
      "https://api.magichour.ai/v1/image-to-video",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.MAGIC_HOUR_API_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: "AuthorityAI Video",
          end_seconds: 5,
          model: "ltx-2",
          resolution: "480p",
          style: {
            prompt: prompt
          },
          assets: {
            image_file_path: asset.file_path
          }
        })
      }
    );

    const videoData = await videoResponse.json();

    if (!videoResponse.ok) {
      throw new Error(
        videoData.message ||
        videoData.error ||
        "Magic Hour video generation failed."
      );
    }

    res.json(videoData);

  } catch (error) {
    console.error("Generation error:", error);

    res.status(500).json({
      error: error.message || "Video generation failed."
    });

  } finally {
    if (localFile) {
      try {
        fs.unlinkSync(localFile);
      } catch {}
    }
  }
});

app.listen(PORT, () => {
  console.log(`AuthorityAI is running on port ${PORT}`);
});