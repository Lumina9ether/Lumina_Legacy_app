const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const orb = document.getElementById("orb");
const responseDisplay = document.getElementById("response");
const audio = document.getElementById("lumina-voice");

let recognition;
let isRecognizing = false;
let autoListen = true;

function setOrbState(state) {
  if (orb) {
    orb.className = 'orb ' + state;
  }
}

function initializeRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isRecognizing = true;
    setOrbState("listening");
    responseDisplay.textContent = "🎤 Listening...";
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    responseDisplay.textContent = `🧠 Thinking about: "${transcript}"`;
    setOrbState("thinking");

    const res = await fetch("/process-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });

    const data = await res.json();
    if (data && data.audio_url) {
      const timestamp = new Date().getTime();
      audio.src = `${data.audio_url}?t=${timestamp}`;
      audio.play();
      setOrbState("speaking");
      responseDisplay.textContent = data.subtitle || "🔊 Speaking...";
      audio.onended = () => {
        setOrbState("idle");
        if (autoListen && recognition) recognition.start();
      };
    } else {
      setOrbState("idle");
      responseDisplay.textContent = "❌ Error generating voice.";
    }
  };

  recognition.onerror = () => {
    setOrbState("idle");
    responseDisplay.textContent = "⚠️ Mic error.";
  };

  recognition.onend = () => {
    isRecognizing = false;
  };
}

startBtn.onclick = () => {
  if (!recognition) initializeRecognition();
  recognition.start();
};

stopBtn.onclick = () => {
  if (recognition && isRecognizing) {
    recognition.stop();
    autoListen = false;
    setOrbState("idle");
  }
};
