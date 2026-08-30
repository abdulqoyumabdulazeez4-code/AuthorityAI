async function generateVideo() {
  const prompt = document.getElementById("prompt").value.trim();

  if (!prompt) {
    alert("Please enter a video prompt.");
    return;
  }

  const result = document.getElementById("result");
  result.textContent = "Generating video...";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Video generation failed.");
    }

    result.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    result.textContent = "Error: " + error.message;
  }
}