import { analyzeSpeech } from "./analysis.js";

const DRILL_TOPICS = [
  // General speaking drills
  "Describe a product idea that solves a daily frustration.",
  "Explain a time you changed your mind after hearing new evidence.",
  "Pitch a community project you want to start this year.",
  "Defend or challenge remote work in 2 minutes.",
  "Talk about a book, podcast, or video that changed your thinking.",
  "Describe how AI should be used responsibly in schools.",
  "Convince your audience to adopt one healthy daily habit.",
  "Explain a failure that taught you an important lesson.",
  "If you could fix one problem in your city, what would it be and how?",
  "Describe a skill you learned on your own and how it changed you.",
  "Make the case for or against social media for teenagers.",
  "Talk about someone who inspired you and why their story matters.",

  // Philippine history
  "Explain the significance of the Propaganda Movement and the role of Jose Rizal in awakening Philippine nationalism.",
  "Describe the events of the Philippine Revolution of 1896 and why Andres Bonifacio is considered a hero of the masses.",
  "Talk about the Philippine-American War and why it is often overlooked in history books.",
  "Explain the impact of the Spanish colonial period on Philippine culture, religion, and identity.",
  "Describe what the EDSA People Power Revolution of 1986 meant for democracy in the Philippines and Southeast Asia.",
  "Who was Gabriela Silang and why is her legacy important to Filipino women today?",
  "Explain the Cry of Pugad Lawin and how it sparked the Philippine Revolution.",
  "Talk about the Bataan Death March and what it reveals about the cost of war for ordinary Filipinos.",
  "Describe the Commonwealth period under Manuel Quezon and how it shaped the road to Philippine independence.",
  "Explain the significance of June 12, 1898 — Philippine Independence Day — and what Emilio Aguinaldo proclaimed.",
  "Talk about the Marcos martial law era: what led to it, how it affected Filipinos, and what lessons it carries.",
  "Describe the role of the Katipunan as a secret revolutionary society and how it unified Filipinos against Spanish rule.",
];

const topicText = document.getElementById("topicText");
const newTopicBtn = document.getElementById("newTopicBtn");
const durationSelect = document.getElementById("durationSelect");
const timerDisplay = document.getElementById("timerDisplay");
const startTimerBtn = document.getElementById("startTimerBtn");
const pauseTimerBtn = document.getElementById("pauseTimerBtn");
const resetTimerBtn = document.getElementById("resetTimerBtn");
const startRecordBtn = document.getElementById("startRecordBtn");
const stopRecordBtn = document.getElementById("stopRecordBtn");
const recordingStatus = document.getElementById("recordingStatus");
const recordingPlayback = document.getElementById("recordingPlayback");
const transcriptInput = document.getElementById("transcriptInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const feedbackPanel = document.getElementById("feedbackPanel");

let remainingSeconds = Number(durationSelect.value);
let timerId = null;
let recorder = null;
let chunks = [];
let recognition = null;
let finalTranscript = "";
let interimTranscript = "";

const formatTimerDisplay = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
};

const renderTimer = () => {
  timerDisplay.textContent = formatTimerDisplay(remainingSeconds);
};

newTopicBtn.addEventListener("click", () => {
  const randomTopic =
    DRILL_TOPICS[Math.floor(Math.random() * DRILL_TOPICS.length)];
  topicText.textContent = randomTopic;
});

durationSelect.addEventListener("change", () => {
  remainingSeconds = Number(durationSelect.value);
  renderTimer();
});

startTimerBtn.addEventListener("click", () => {
  if (timerId) {
    return;
  }
  timerId = setInterval(() => {
    remainingSeconds = Math.max(0, remainingSeconds - 1);
    renderTimer();
    if (remainingSeconds === 0) {
      clearInterval(timerId);
      timerId = null;
    }
  }, 1000);
});

pauseTimerBtn.addEventListener("click", () => {
  if (!timerId) {
    return;
  }
  clearInterval(timerId);
  timerId = null;
});

resetTimerBtn.addEventListener("click", () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  remainingSeconds = Number(durationSelect.value);
  renderTimer();
});

const setRecordingState = (isRecording) => {
  startRecordBtn.disabled = isRecording;
  stopRecordBtn.disabled = !isRecording;
  if (isRecording) {
    recordingStatus.textContent = "Recording...";
  }
};

startRecordBtn.addEventListener("click", async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    recordingStatus.textContent = "Recording not supported in this browser.";
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);
    chunks = [];
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    });
    recorder.addEventListener("stop", () => {
      const audioBlob = new Blob(chunks, {
        type: recorder.mimeType || "audio/webm",
      });
      recordingPlayback.src = URL.createObjectURL(audioBlob);
      stream.getTracks().forEach((track) => track.stop());

      if (recognition) {
        recognition.stop();
        recognition = null;
      }

      const fullTranscript = (finalTranscript + " " + interimTranscript).trim();
      startRecordBtn.disabled = false;
      stopRecordBtn.disabled = true;

      if (fullTranscript) {
        transcriptInput.value = fullTranscript;
        recordingStatus.textContent =
          "Transcript ready — review and analyze below.";
      } else {
        recordingStatus.textContent = "Not recording";
      }
    });

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      finalTranscript = "";
      interimTranscript = "";

      recognition.addEventListener("result", (event) => {
        interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        recordingStatus.textContent = `Recording... "${(finalTranscript + interimTranscript).trim()}"`;
      });

      recognition.addEventListener("error", (event) => {
        if (event.error !== "no-speech") {
          console.warn("Speech recognition error:", event.error);
        }
      });

      recognition.start();
    }

    recorder.start();
    setRecordingState(true);
  } catch (error) {
    recordingStatus.textContent =
      "Microphone permission denied or unavailable.";
  }
});

stopRecordBtn.addEventListener("click", () => {
  if (recorder && recorder.state === "recording") {
    recorder.stop();
  }
});

const listFillerCounts = (fillerCounts) => {
  const entries = Object.entries(fillerCounts);
  if (entries.length === 0) {
    return "<li>No common filler words detected 🎉</li>";
  }
  return entries
    .map(([word, count]) => `<li><strong>${word}</strong>: ${count}</li>`)
    .join("");
};

analyzeBtn.addEventListener("click", () => {
  const result = analyzeSpeech(
    transcriptInput.value,
    Number(durationSelect.value),
  );
  feedbackPanel.innerHTML = `
    <p><strong>Clarity score:</strong> ${result.clarityScore}/100</p>
    <p><strong>Delivery score:</strong> ${result.deliveryScore}/100</p>
    <p><strong>Words per minute:</strong> ${result.wordsPerMinute}</p>
    <p><strong>Estimated pauses:</strong> ${result.estimatedPauses}</p>
    <h3>Filler words</h3>
    <ul>${listFillerCounts(result.fillerCounts)}</ul>
    <h3>Coaching tips</h3>
    <ul>${result.tips.map((tip) => `<li>${tip}</li>`).join("")}</ul>
  `;
});

renderTimer();
