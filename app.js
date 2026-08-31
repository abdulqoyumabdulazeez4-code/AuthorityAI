function login() {
    const password = document.getElementById("passwordBox").value;

    if (password === "Authority2026") {
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("mainApp").style.display = "block";
    } else {
        document.getElementById("loginResult").textContent =
            "Wrong password";
    }
}

async function generateVideo() {
  const prompt = document.getElementById("prompt").value.trim();
  const imageFile = document.getElementById("imageUpload").files[0];
  const result = document.getElementById("result");

  if (!imageFile) {
    result.textContent = "Please select an image first.";
    return;
  }

  if (!prompt) {
    result.textContent = "Please enter a video prompt.";
    return;
  }

  result.textContent = "Uploading image and creating video...";

  try {
    const formData = new FormData();

    formData.append("image", imageFile);
    formData.append("prompt", prompt);

    const response = await fetch("/api/generate", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Video generation failed.");
    }

    const projectId = data.project_id;

    result.textContent = "Video is generating... Please wait.";

    let finished = false;

    while (!finished) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(`/api/status/${projectId}`);

      const statusData = await statusResponse.json();

      if (!statusResponse.ok) {
        throw new Error(
          statusData.error || "Could not check video status."
        );
      }

      const status = statusData.status || "";

      if (status === "complete") {
        finished = true;

        const videoUrl = statusData.downloads?.[0]?.url;

        if (videoUrl) {
          result.innerHTML = `
            <p>Video ready! 🎉</p>
            <video controls width="100%" src="${videoUrl}"></video>
            <br><br>
            <a href="${videoUrl}" target="_blank">
              Open / Download Video
            </a>
          `;
        } else {
          result.textContent =
            "Video completed, but no download URL was returned.";
        }
      }

      if (status === "error") {
        finished = true;

        throw new Error(
          statusData.error?.message ||
          statusData.error ||
          "Magic Hour video generation failed."
        );
      }

      if (status === "canceled") {
        finished = true;

        throw new Error("The video generation was canceled.");
      }
    }

  } catch (error) {
    console.error(error);
    result.textContent = "Error: " + error.message;
  }
}