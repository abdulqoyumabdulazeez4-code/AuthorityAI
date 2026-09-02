const express = require("express");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
    dest: "uploads/"
});

app.use(express.json());
app.use(express.static(__dirname));

app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});


// ==========================================
// GENERATE TALKING VIDEO
// ==========================================

app.post(
    "/api/generate",
    upload.single("image"),
    async (req, res) => {

        let imageFile;

        try {

            // ==========================================
            // CHECK IMAGE
            // ==========================================

            if (!req.file) {
                return res.status(400).json({
                    error: "Please upload an image."
                });
            }

            imageFile = req.file;


            // ==========================================
            // GET USER INPUT
            // ==========================================

            const prompt =
                req.body.prompt?.trim();

            let duration =
                Number(req.body.duration) || 5;


            if (!prompt) {
                return res.status(400).json({
                    error: "Please enter what the person should say."
                });
            }


            // ==========================================
            // LIMIT VIDEO TO 5 SECONDS
            // ==========================================

            duration = 5;


            // ==========================================
            // STEP 1
            // UPLOAD IMAGE TO MAGIC HOUR
            // ==========================================

            console.log("Uploading image to Magic Hour...");


            const imageExtension =
                imageFile.originalname
                    .split(".")
                    .pop()
                    .toLowerCase();


            const uploadUrlResponse =
                await fetch(
                    "https://api.magichour.ai/v1/files/upload-urls",
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${process.env.MAGIC_HOUR_API_KEY}`,

                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json"
                        },

                        body: JSON.stringify({
                            items: [
                                {
                                    type: "image",
                                    extension: imageExtension
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
                    "Could not get image upload URL."
                );

            }


            const imageAsset =
                uploadUrlData.items?.[0];


            if (!imageAsset) {

                throw new Error(
                    "Magic Hour did not return an image upload location."
                );

            }


            const imageBuffer =
                fs.readFileSync(
                    imageFile.path
                );


            const imageUploadResponse =
                await fetch(
                    imageAsset.upload_url,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                imageFile.mimetype
                        },

                        body: imageBuffer
                    }
                );


            if (!imageUploadResponse.ok) {

                throw new Error(
                    "Could not upload image to Magic Hour."
                );

            }


            console.log(
                "Image uploaded successfully."
            );


            // ==========================================
            // STEP 2
            // GENERATE DAVID ATTENBOROUGH VOICE
            // ==========================================

            console.log(
                "Generating David Attenborough voice..."
            );


            const voiceResponse =
                await fetch(
                    "https://api.magichour.ai/v1/ai-voice-generator",
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${process.env.MAGIC_HOUR_API_KEY}`,

                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json"
                        },

                        body: JSON.stringify({

                            name:
                                "AuthorityAI Voice",

                            style: {

                                prompt:
                                    prompt,

                                voice_name:
                                    "David Attenborough"

                            }

                        })
                    }
                );


            const voiceData =
                await voiceResponse.json();


            if (!voiceResponse.ok) {

                throw new Error(
                    voiceData.message ||
                    voiceData.error ||
                    "Could not create AI voice."
                );

            }


            const audioProjectId =
                voiceData.id;


            if (!audioProjectId) {

                throw new Error(
                    "Magic Hour did not return an audio project ID."
                );

            }


            console.log(
                "Voice project:",
                audioProjectId
            );


            // ==========================================
            // STEP 3
            // WAIT FOR AUDIO
            // ==========================================

            let audioUrl = null;


            for (let i = 0; i < 120; i++) {

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            3000
                        )
                );


                const audioStatusResponse =
                    await fetch(
                        `https://api.magichour.ai/v1/audio-projects/${audioProjectId}`,
                        {
                            method: "GET",

                            headers: {
                                Authorization:
                                    `Bearer ${process.env.MAGIC_HOUR_API_KEY}`,

                                Accept:
                                    "application/json"
                            }
                        }
                    );


                const audioStatusData =
                    await audioStatusResponse.json();


                if (!audioStatusResponse.ok) {

                    throw new Error(
                        audioStatusData.message ||
                        audioStatusData.error ||
                        "Could not check voice status."
                    );

                }


                const audioStatus =
                    audioStatusData.status || "";


                console.log(
                    "Voice status:",
                    audioStatus
                );


                if (audioStatus === "complete") {

                    audioUrl =
                        audioStatusData
                            .downloads?.[0]?.url;

                    break;

                }


                if (
                    audioStatus === "error" ||
                    audioStatus === "canceled"
                ) {

                    throw new Error(
                        "AI voice generation failed."
                    );

                }

            }


            if (!audioUrl) {

                throw new Error(
                    "AI voice generation timed out."
                );

            }


            console.log(
                "Voice generated successfully."
            );


            // ==========================================
            // STEP 4
            // CREATE TALKING PHOTO
            // ==========================================

            console.log(
                "Creating 5-second talking photo..."
            );


            const talkingPhotoResponse =
                await fetch(
                    "https://api.magichour.ai/v1/ai-talking-photo",
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${process.env.MAGIC_HOUR_API_KEY}`,

                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json"
                        },

                        body: JSON.stringify({

                            name:
                                "AuthorityAI Talking Video",

                            start_seconds:
                                0,

                            end_seconds:
                                duration,

                            assets: {

                                image_file_path:
                                    imageAsset.file_path,

                                audio_file_path:
                                    audioUrl

                            }

                        })
                    }
                );


            const talkingPhotoData =
                await talkingPhotoResponse.json();


            if (!talkingPhotoResponse.ok) {

                const magicHourMessage =
                    talkingPhotoData.message ||
                    talkingPhotoData.error ||
                    "Talking photo generation failed.";


                throw new Error(
                    magicHourMessage
                );

            }


            console.log(
                "Talking video project created:",
                talkingPhotoData.id
            );


            // ==========================================
            // SEND PROJECT ID TO WEBSITE
            // ==========================================

            res.json({

                success: true,

                project_id:
                    talkingPhotoData.id

            });


        } catch (error) {

            console.error(
                "AuthorityAI generation error:",
                error
            );


            res.status(500).json({

                error:
                    error.message ||
                    "Video generation failed."

            });


        } finally {

            // ==========================================
            // DELETE TEMPORARY IMAGE
            // ==========================================

            if (imageFile) {

                try {

                    fs.unlinkSync(
                        imageFile.path
                    );

                } catch {}

            }

        }

    }
);


// ==========================================
// CHECK VIDEO STATUS
// ==========================================

app.get(
    "/api/status/:id",
    async (req, res) => {

        try {

            const response =
                await fetch(
                    `https://api.magichour.ai/v1/video-projects/${req.params.id}`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${process.env.MAGIC_HOUR_API_KEY}`,

                            Accept:
                                "application/json"
                        }
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                return res
                    .status(response.status)
                    .json(data);

            }


            res.json(data);


        } catch (error) {

            console.error(
                "Status error:",
                error
            );


            res.status(500).json({

                error:
                    error.message

            });

        }

    }
);


// ==========================================
// START SERVER
// ==========================================

app.listen(
    PORT,
    () => {

        console.log(
            `AuthorityAI is running on port ${PORT}`
        );

    }
);