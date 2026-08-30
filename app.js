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

    result.textContent =
      "Video is generating... Please wait.";

    let finished = false;

    while (!finished) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(
        `/api/status/${projectId}`
      );

      const statusData = await statusResponse.json();

      if (!statusResponse.ok) {
        throw new Error(
          statusData.error || "Could not check video status."
        );
      }

      const status =
        statusData.status ||
        statusData.state ||
        "";

      if (
        status.toLowerCase() === "complete" ||
        status.toLowerCase() === "completed" ||
        status.toLowerCase() === "succeeded"
      ) {
        finished = true;

        const videoUrl =
          statusData.video_url ||
          statusData.output_url ||
          statusData.download_url ||
          statusData.outputs?.[0]?.url;

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
            "Video completed, but Magic Hour did not return the video URL.";
        }
      }

      if (
        status.toLowerCase() === "failed" ||
        status.toLowerCase() === "error"
      ) {
        throw new Error(
          statusData.error ||
          statusData.message ||
          "Magic Hour video generation failed."
        );
      }
    }

  } catch (error) {
    console.error(error);
    result.textContent = "Error: " + error.message;
  }
}