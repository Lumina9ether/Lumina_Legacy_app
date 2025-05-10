const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const orb = document.getElementById("orb");
const responseDisplay = document.getElementById("response");
const audio = document.getElementById("lumina-voice");

let recognition;
let isRecognizing = false;

function initializeRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isRecognizing = true;
    startBtn.disabled = true;
    orb.classList.remove("idle");
    orb.classList.add("listening");
    responseDisplay.textContent = "🎤 Listening...";
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    responseDisplay.textContent = `🧠 Thinking about: "${transcript}"`;

    const res = await fetch("/process-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    const data = await res.json();
    if (data && data.audio_url) {
      audio.src = data.audio_url;
      audio.play();
      responseDisplay.textContent = data.subtitle || "🔊 Speaking...";
    } else {
      responseDisplay.textContent = "❌ Error generating voice.";
    }
  };

  recognition.onerror = () => {
    responseDisplay.textContent = "⚠️ Mic error.";
  };

  recognition.onend = () => {
    isRecognizing = false;
    startBtn.disabled = false;
    orb.classList.remove("listening");
    orb.classList.add("idle");
  };
}

startBtn.onclick = () => {
  if (!recognition) initializeRecognition();
  recognition.start();
};

stopBtn.onclick = () => {
  if (recognition && isRecognizing) {
    recognition.stop();
  }
};
