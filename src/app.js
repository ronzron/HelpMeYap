import { analyzeSpeech } from "./analysis.js";

const DRILL_TOPICS = [
  "Describe a product idea that solves a daily frustration.",
  "Explain a time you changed your mind after hearing new evidence.",
  "Pitch a community project you want to start this year.",
  "Defend or challenge remote work in 2 minutes.",
  "Talk about a book, podcast, or video that changed your thinking.",
  "Describe how AI should be used responsibly in schools.",
  "Convince your audience to adopt one healthy daily habit.",
  "Explain a failure that taught you an important lesson.",
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

const formatTimerDisplay = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
};

const renderTimer = () => {
  timerDisplay.textContent = formatTimerDisplay(remainingSeconds);
};

newTopicBtn.addEventListener("click", () => {
  const nextTopic = DRILL_TOPICS[Math.floor(Math.random() * DRILL_TOPICS.length)];
  topicText.textContent = nextTopic;
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
  recordingStatus.textContent = isRecording ? "Recording..." : "Not recording";
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
      const audioBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      recordingPlayback.src = URL.createObjectURL(audioBlob);
      stream.getTracks().forEach((track) => track.stop());
      setRecordingState(false);
    });
    recorder.start();
    setRecordingState(true);
  } catch (error) {
    recordingStatus.textContent = "Microphone permission denied or unavailable.";
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
  return entries.map(([word, count]) => `<li><strong>${word}</strong>: ${count}</li>`).join("");
};

analyzeBtn.addEventListener("click", () => {
  const result = analyzeSpeech(transcriptInput.value, Number(durationSelect.value));
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
