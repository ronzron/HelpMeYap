import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSpeech } from "../src/analysis.js";

test("analyzeSpeech counts filler words", () => {
  const result = analyzeSpeech("Um I was like actually excited, you know?", 60);
  assert.equal(result.totalFillers, 4);
  assert.equal(result.fillerCounts.um, 1);
  assert.equal(result.fillerCounts.like, 1);
  assert.equal(result.fillerCounts.actually, 1);
  assert.equal(result.fillerCounts["you know"], 1);
});

test("analyzeSpeech detects pause markers", () => {
  const result = analyzeSpeech("I started... then [pause] I continued -- and finished.", 90);
  assert.equal(result.estimatedPauses, 3);
});

test("analyzeSpeech returns guidance for empty transcript", () => {
  const result = analyzeSpeech("   ", 90);
  assert.equal(result.clarityScore, 0);
  assert.equal(result.totalFillers, 0);
  assert.equal(result.wordCount, 0);
  assert.equal(result.estimatedPauses, 0);
  assert.equal(result.wordsPerMinute, 0);
  assert.match(result.tips[0], /transcript/i);
});

test("analyzeSpeech applies long sentence clarity penalty", () => {
  const longSentence = `${"word ".repeat(29)}.`.trim();
  const result = analyzeSpeech(longSentence, 90);
  assert.equal(result.clarityScore, 85);
});

test("analyzeSpeech does not penalize sentence length at threshold", () => {
  const thresholdSentence = `${"word ".repeat(28)}.`.trim();
  const result = analyzeSpeech(thresholdSentence, 90);
  assert.equal(result.clarityScore, 100);
});
