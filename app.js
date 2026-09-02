function login() {
    const password =
        document.getElementById("passwordBox").value;

    const loginResult =
        document.getElementById("loginResult");

    if (password === "Authority2026") {

        document.getElementById("loginPage").style.display =
            "none";

        document.getElementById("mainApp").style.display =
            "block";

    } else {

        loginResult.textContent =
            "Wrong password";

    }
}


// ==========================================
// GENERATE TALKING VIDEO
// ==========================================

async function generateVideo() {

    const prompt =
        document.getElementById("prompt").value.trim();

    const imageFile =
        document.getElementById("imageUpload").files[0];

    const videoLength =
        Number(
            document.getElementById("videoLength").value
        );

    const result =
        document.getElementById("result");


    // ==========================================
    // CHECK IMAGE
    // ==========================================

    if (!imageFile) {

        result.innerHTML =
            "⚠️ Please select an image first.";

        return;
    }


    // ==========================================
    // CHECK TEXT
    // ==========================================

    if (!prompt) {

        result.innerHTML =
            "⚠️ Please enter what you want the person to say.";

        return;
    }


    // ==========================================
    // SHOW LOADING
    // ==========================================

    result.innerHTML = `
        <p>
            ⏳ <strong>Starting AuthorityAI...</strong>
        </p>

        <p>
            🎙️ Creating the AI voice...
        </p>

        <p>
            👤 Preparing the talking photo...
        </p>

        <p>
            Please wait. Do not close this page.
        </p>
    `;


    try {

        // ==========================================
        // CREATE FORM DATA
        // ==========================================

        const formData =
            new FormData();

        formData.append(
            "image",
            imageFile
        );

        formData.append(
            "prompt",
            prompt
        );

        formData.append(
            "duration",
            videoLength
        );


        // ==========================================
        // SEND TO OUR SERVER
        // ==========================================

        const response =
            await fetch(
                "/api/generate",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Video generation failed."
            );

        }


        const projectId =
            data.project_id;


        if (!projectId) {

            throw new Error(
                "No video project ID was returned."
            );

        }


        // ==========================================
        // VIDEO IS NOW GENERATING
        // ==========================================

        result.innerHTML = `
            <p>
                🎬 <strong>Your talking video is generating...</strong>
            </p>

            <p>
                🎙️ David Attenborough voice created.
            </p>

            <p>
                👤 Animating your image...
            </p>

            <p>
                ⏳ Please wait...
            </p>
        `;


        // ==========================================
        // CHECK VIDEO STATUS
        // ==========================================

        let finished = false;

        let attempts = 0;

        const maxAttempts = 240;


        while (!finished) {

            attempts++;


            if (attempts > maxAttempts) {

                throw new Error(
                    "Video generation is taking too long. Please try again later."
                );

            }


            // Wait 5 seconds
            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        5000
                    )
            );


            const statusResponse =
                await fetch(
                    `/api/status/${projectId}`
                );


            const statusData =
                await statusResponse.json();


            if (!statusResponse.ok) {

                throw new Error(
                    statusData.error ||
                    "Could not check video status."
                );

            }


            const status =
                statusData.status || "";


            console.log(
                "Video status:",
                status
            );


            // ==========================================
            // VIDEO COMPLETE
            // ==========================================

            if (status === "complete") {

                finished = true;


                const videoUrl =
                    statusData
                        .downloads?.[0]?.url;


                if (!videoUrl) {

                    throw new Error(
                        "Video completed, but no video URL was returned."
                    );

                }


                result.innerHTML = `

                    <p>
                        🎉 <strong>
                        Your AuthorityAI talking video is ready!
                        </strong>
                    </p>

                    <video
                        controls
                        playsinline
                        width="100%"
                        src="${videoUrl}">
                    </video>

                    <br><br>

                    <a
                        href="${videoUrl}"
                        target="_blank"
                        rel="noopener noreferrer">

                        ▶️ Open / Download Video

                    </a>

                `;

            }


            // ==========================================
            // VIDEO ERROR
            // ==========================================

            else if (status === "error") {

                finished = true;


                const errorMessage =
                    statusData.error?.message ||
                    statusData.error ||
                    "Talking video generation failed.";


                throw new Error(
                    errorMessage
                );

            }


            // ==========================================
            // VIDEO CANCELED
            // ==========================================

            else if (status === "canceled") {

                finished = true;


                throw new Error(
                    "The video generation was canceled."
                );

            }


            // ==========================================
            // STILL PROCESSING
            // ==========================================

            else {

                result.innerHTML = `

                    <p>
                        🎬 <strong>
                        Your talking video is generating...
                        </strong>
                    </p>

                    <p>
                        📊 Status:
                        ${status || "processing"}
                    </p>

                    <p>
                        ⏳ Please wait...
                    </p>

                `;

            }

        }


    } catch (error) {

        console.error(
            "AuthorityAI error:",
            error
        );


        result.innerHTML = `

            <p>
                ❌ <strong>Something went wrong.</strong>
            </p>

            <p>
                ${error.message}
            </p>

        `;

    }

}