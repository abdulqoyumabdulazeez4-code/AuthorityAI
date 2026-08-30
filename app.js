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

  result.textContent = "Uploading image and generating video...";

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

    result.textContent = JSON.stringify(data, null, 2);

  } catch (error) {
    console.error(error);
    result.textContent = "Error: " + error.message;
  }
}
  