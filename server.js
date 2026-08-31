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
            req.body.prompt ||
            "A cinematic animation with smooth camera movement";

        const duration = Number(req.body.duration) || 5;

        const extension =
            req.file.originalname
                .split(".")
                .pop()
                .toLowerCase();

        // Get Magic Hour upload URL
        const uploadUrlResponse = await fetch(
            "https://api.magichour.ai/v1/files/upload-urls",
            {
                method: "POST",
                headers: {
                    Authorization:
                        `Bearer ${process.env.MAGIC_HOUR_API_KEY}`,
                    "Content-Type": "application/json",
                    Accept: "application/json"
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

        const uploadUrlData =
            await uploadUrlResponse.json();

        if (!uploadUrlResponse.ok) {
            throw new Error(
                uploadUrlData.message ||
                uploadUrlData.error ||
                "Could not get upload URL."
            );
        }

        const asset = uploadUrlData.items[0];

        // Upload image
        const imageBuffer =
            fs.readFileSync(localFile);

        const fileUploadResponse = await fetch(
            asset.upload_url,
            {
                method: "PUT",
                headers: {
                    "Content-Type": req.file.mimetype
                },
                body: imageBuffer
            }
        );

        if (!fileUploadResponse.ok) {
            throw new Error(
                "Could not upload image to Magic Hour."
            );
        }

        // Create video
        const videoResponse = await fetch(
            "https://api.magichour.ai/v1/image-to-video",
            {
                method: "POST",
                headers: {
                    Authorization:
                        `Bearer ${process.env.MAGIC_HOUR_API_KEY}`,
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({
                    name: "AuthorityAI Video",
                    end_seconds: duration,
                    model: "ltx-2",
                    resolution: "480p",
                    style: {
                        prompt: prompt
                    },
                    assets: {
                        image_file_path:
                            asset.file_path
                    }
                })
            }
        );

        const videoData =
            await videoResponse.json();

        if (!videoResponse.ok) {
            throw new Error(
                videoData.message ||
                videoData.error ||
                "Video creation failed."
            );
        }

        res.json({
            success: true,
            project_id: videoData.id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error:
                error.message ||
                "Video generation failed."
        });

    } finally {
        if (localFile) {
            try {
                fs.unlinkSync(localFile);
            } catch {}
        }
    }
});

app.get("/api/status/:id", async (req, res) => {
    try {
        const response = await fetch(
            `https://api.magichour.ai/v1/video-projects/${req.params.id}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.MAGIC_HOUR_API_KEY}`,
                    Accept: "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(
        `AuthorityAI is running on port ${PORT}`
    );
});