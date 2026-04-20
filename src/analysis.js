const FILLER_WORDS = ["um", "uh", "like", "you know", "actually", "basically", "literally", "so"];
const FILLER_PENALTY_PER_WORD = 4;
const MAX_FILLER_PENALTY = 45;
const LOW_WPM_THRESHOLD = 100;
const HIGH_WPM_THRESHOLD = 180;
const PACE_PENALTY = 20;
const PAUSE_PENALTY_PER_MARKER = 3;
const MAX_PAUSE_PENALTY = 20;
const MAX_SENTENCE_WORDS = 28;
const LONG_SENTENCE_PENALTY = 15;
const MIN_DURATION_MINUTES = 1 / 60;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const countWordOccurrences = (transcript, word) => {
  const pattern = new RegExp(`\\b${escapeRegex(word)}\\b`, "gi");
  return (transcript.match(pattern) || []).length;
};

const countWords = (text) => (text.match(/\b[\w']+\b/g) || []).length;

export const analyzeSpeech = (transcript, durationSeconds = 90) => {
  const cleanTranscript = transcript.trim();
  if (!cleanTranscript) {
    return {
      fillerCounts: {},
      totalFillers: 0,
      wordCount: 0,
      estimatedPauses: 0,
      wordsPerMinute: 0,
      clarityScore: 0,
      deliveryScore: 0,
      tips: ["Add a short transcript to get feedback."],
    };
  }

  const fillerCounts = Object.fromEntries(
    FILLER_WORDS.map((word) => [word, countWordOccurrences(cleanTranscript, word)]).filter(([, count]) => count > 0),
  );
  const totalFillers = Object.values(fillerCounts).reduce((sum, count) => sum + count, 0);

  const wordCount = countWords(cleanTranscript);
  const estimatedPauses = (cleanTranscript.match(/(\.\.\.|—|--|\[pause\])/gi) || []).length;
  const minutes = Math.max(durationSeconds / 60, MIN_DURATION_MINUTES);
  const wordsPerMinute = Math.round(wordCount / minutes);

  const fillerPenalty = Math.min(totalFillers * FILLER_PENALTY_PER_WORD, MAX_FILLER_PENALTY);
  const pacePenalty = wordsPerMinute < LOW_WPM_THRESHOLD || wordsPerMinute > HIGH_WPM_THRESHOLD ? PACE_PENALTY : 0;
  const pausePenalty = Math.min(estimatedPauses * PAUSE_PENALTY_PER_MARKER, MAX_PAUSE_PENALTY);
  const sentencePenalty = cleanTranscript.split(/[.!?]/).some((sentence) => countWords(sentence) > MAX_SENTENCE_WORDS)
    ? LONG_SENTENCE_PENALTY
    : 0;

  const clarityScore = Math.max(0, 100 - fillerPenalty - sentencePenalty);
  const deliveryScore = Math.max(0, 100 - pacePenalty - pausePenalty);

  const tips = [];
  if (totalFillers > 3) {
    tips.push("Try replacing filler words with a 1-second silent pause before your next point.");
  }
  if (estimatedPauses > 3) {
    tips.push("You pause often. Group ideas into shorter phrases to keep momentum.");
  }
  if (wordsPerMinute < LOW_WPM_THRESHOLD) {
    tips.push("Your pace is slow. Practice emphasizing key words while slightly increasing speed.");
  } else if (wordsPerMinute > HIGH_WPM_THRESHOLD) {
    tips.push("Your pace is fast. Add intentional pauses after each major point.");
  }
  if (tips.length === 0) {
    tips.push("Great balance. Next step: vary tone and stress key words for stronger delivery.");
  }

  return {
    fillerCounts,
    totalFillers,
    wordCount,
    estimatedPauses,
    wordsPerMinute,
    clarityScore,
    deliveryScore,
    tips,
  };
};
