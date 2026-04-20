const FILLER_WORDS = ["um", "uh", "like", "you know", "actually", "basically", "literally", "so"];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const countWordOccurrences = (transcript, word) => {
  const pattern = new RegExp(`\\b${escapeRegex(word)}\\b`, "gi");
  return (transcript.match(pattern) || []).length;
};

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

  const wordCount = (cleanTranscript.match(/\b[\w']+\b/g) || []).length;
  const estimatedPauses = (cleanTranscript.match(/(\.\.\.|—|--|\[pause\])/gi) || []).length;
  const minutes = Math.max(durationSeconds, 1) / 60;
  const wordsPerMinute = Math.round(wordCount / minutes);

  const fillerPenalty = Math.min(totalFillers * 4, 45);
  const pacePenalty = wordsPerMinute < 100 || wordsPerMinute > 180 ? 20 : 0;
  const pausePenalty = Math.min(estimatedPauses * 3, 20);
  const sentencePenalty = cleanTranscript.split(/[.!?]/).some((sentence) => sentence.trim().split(/\s+/).length > 28) ? 15 : 0;

  const clarityScore = Math.max(0, 100 - fillerPenalty - sentencePenalty);
  const deliveryScore = Math.max(0, 100 - pacePenalty - pausePenalty);

  const tips = [];
  if (totalFillers > 3) {
    tips.push("Try replacing filler words with a 1-second silent pause before your next point.");
  }
  if (estimatedPauses > 3) {
    tips.push("You pause often. Group ideas into shorter phrases to keep momentum.");
  }
  if (wordsPerMinute < 100) {
    tips.push("Your pace is slow. Practice emphasizing key words while slightly increasing speed.");
  } else if (wordsPerMinute > 180) {
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
