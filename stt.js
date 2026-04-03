export async function sendAudioToServer(uri) {
  try {
    let formData = new FormData();
    formData.append("audio", {
      uri,
      name: "speech.wav",
      type: "audio/wav",
    });

    const response = await fetch("http://192.168.45.168:5001/stt", {
      method: "POST",
      body: formData,
    });

    return await response.json();
  } catch (err) {
    console.log("STT upload error:", err);
    return { text: "" };
  }
}
