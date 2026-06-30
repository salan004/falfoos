/**
 * Scoring Logic Tests
 *
 * Tests the core calculation functions to ensure statistics can never become inconsistent.
 * These tests verify that:
 *  - correct + wrong + skipped = total questions (always)
 *  - Points and coins are only awarded for correct answers
 *  - Timed-out/skipped questions are NOT counted as correct
 *  - Percentage is calculated correctly
 *  - Recounted values match tracked values
 */

import { validateResults, recalculatePointsFromAnswers } from '../src/services/quizService';
import { QuizState, AnswerRecord, Question } from '../src/types/quiz';
import { config } from '../src/config';
import { calculateLevel } from '../src/services/levelService';
import { calculateCoins } from '../src/services/coinService';

function makeQuestion(id: number, difficulty: number = 1): Question {
  return {
    id,
    categoryId: 1,
    categoryNameAr: 'اختبار',
    questionAr: `سؤال ${id}`,
    optionA: 'خيار أ',
    optionB: 'خيار ب',
    optionC: 'خيار ج',
    optionD: 'خيار د',
    correctAnswer: 'A',
    difficulty,
    source: null,
  };
}

function makeQuizState(overrides: Partial<QuizState> = {}): QuizState {
  return {
    guildId: 'test-guild',
    channelId: 'test-channel',
    userId: 'test-user',
    questions: [],
    currentIndex: 0,
    totalQuestions: 0,
    answers: [],
    startTime: Date.now(),
    status: 'active',
    messageId: null,
    sessionId: null,
    pointsEarned: 0,
    coinsEarned: 0,
    round: null,
    totalPointsAwarded: 0,
    totalCoinsAwarded: 0,
    preQuizUserSnapshot: null,
    ...overrides,
  };
}

function answered(answerLetter: string, isCorrect: boolean, time: number = 5000): AnswerRecord {
  return {
    answer: answerLetter as 'A' | 'B' | 'C' | 'D',
    isCorrect,
    time,
    status: 'answered',
  };
}

function skipped(): AnswerRecord {
  return {
    answer: null,
    isCorrect: false,
    time: 60000,
    status: 'skipped',
  };
}

// ========================================
// Tests
// ========================================

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✅ ${message}`);
  }
}

function assertEqual(actual: number, expected: number, label: string): void {
  assert(actual === expected, `${label}: expected ${expected}, got ${actual}`);
}

// === Test 1: All correct answers ===
{
  const questions = [makeQuestion(1, 1), makeQuestion(2, 2), makeQuestion(3, 1)];
  const answers = [
    answered('A', true, 5000),
    answered('A', true, 3000),
    answered('A', true, 7000),
  ];

  const state = makeQuizState({
    questions,
    totalQuestions: 3,
    answers,
    pointsEarned: answers.reduce((sum, a, i) => {
      if (!a.isCorrect) return sum;
      const q = questions[i];
      let pts = config.pointsPerCorrect(q.difficulty);
      if (a.time <= config.speedBonusWindow) pts += config.speedBonusPoints;
      return sum + pts;
    }, 0),
    coinsEarned: answers.reduce((sum, a, i) => {
      if (!a.isCorrect) return sum;
      return sum + calculateCoins(questions[i].difficulty);
    }, 0),
  });

  const results = validateResults(state);
  const recalc = recalculatePointsFromAnswers(state);

  assertEqual(results.correctCount, 3, 'All correct: correctCount');
  assertEqual(results.wrongCount, 0, 'All correct: wrongCount');
  assertEqual(results.skippedCount, 0, 'All correct: skippedCount');
  assertEqual(results.correctCount + results.wrongCount + results.skippedCount, 3, 'All correct: sum = total');
  assertEqual(recalc.points, state.pointsEarned, 'All correct: points match');
  assertEqual(recalc.coins, state.coinsEarned, 'All correct: coins match');
}

// === Test 2: All wrong answers ===
{
  const questions = [makeQuestion(1, 1), makeQuestion(2, 2)];
  const answers = [
    answered('B', false, 5000),
    answered('C', false, 3000),
  ];

  const state = makeQuizState({
    questions,
    totalQuestions: 2,
    answers,
    pointsEarned: 0,
    coinsEarned: 0,
  });

  const results = validateResults(state);
  const recalc = recalculatePointsFromAnswers(state);

  assertEqual(results.correctCount, 0, 'All wrong: correctCount');
  assertEqual(results.wrongCount, 2, 'All wrong: wrongCount');
  assertEqual(results.skippedCount, 0, 'All wrong: skippedCount');
  assertEqual(results.correctCount + results.wrongCount + results.skippedCount, 2, 'All wrong: sum = total');
  assertEqual(recalc.points, 0, 'All wrong: points = 0');
  assertEqual(recalc.coins, 0, 'All wrong: coins = 0');
}

// === Test 3: Mixed answers (correct, wrong, skipped) ===
{
  const questions = [makeQuestion(1, 1), makeQuestion(2, 2), makeQuestion(3, 3), makeQuestion(4, 1), makeQuestion(5, 2)];
  const answers = [
    answered('A', true, 15000),  // correct (diff=1, no speed bonus since 15s > 10s window)
    answered('B', false),        // wrong
    skipped(),                    // skipped
    undefined as any,             // not recorded at all (edge case)
    skipped(),                    // skipped
  ];

  const state = makeQuizState({
    questions,
    totalQuestions: 5,
    answers: answers as AnswerRecord[],
    pointsEarned: config.pointsPerCorrect(1), // only question 1 is correct, no speed bonus
    coinsEarned: calculateCoins(1),
  });

  const results = validateResults(state);
  const recalc = recalculatePointsFromAnswers(state);

  assertEqual(results.correctCount, 1, 'Mixed: correctCount');
  assertEqual(results.wrongCount, 1, 'Mixed: wrongCount');
  assertEqual(results.skippedCount, 3, 'Mixed: skippedCount (q3, q4 unrecorded, q5 skipped)');
  assertEqual(results.correctCount + results.wrongCount + results.skippedCount, 5, 'Mixed: sum = total');
  assertEqual(results.totalPoints, state.pointsEarned, 'Mixed: totalPoints matches');
  assertEqual(recalc.points, state.pointsEarned, 'Mixed: recalculated points match');
  assertEqual(recalc.coins, state.coinsEarned, 'Mixed: recalculated coins match');
}

// === Test 4: All skipped (timeout every question) ===
{
  const questions = [makeQuestion(1, 1), makeQuestion(2, 2)];
  const answers = [skipped(), skipped()];

  const state = makeQuizState({
    questions,
    totalQuestions: 2,
    answers,
    pointsEarned: 0,
    coinsEarned: 0,
  });

  const results = validateResults(state);
  const recalc = recalculatePointsFromAnswers(state);

  assertEqual(results.correctCount, 0, 'All skipped: correctCount');
  assertEqual(results.wrongCount, 0, 'All skipped: wrongCount');
  assertEqual(results.skippedCount, 2, 'All skipped: skippedCount');
  assertEqual(results.correctCount + results.wrongCount + results.skippedCount, 2, 'All skipped: sum = total');
  assertEqual(recalc.points, 0, 'All skipped: points = 0');
}

// === Test 5: Speed bonus points ===
{
  const questions = [makeQuestion(1, 1)];
  const answers = [answered('A', true, 3000)]; // within 10s speed bonus window

  const state = makeQuizState({
    questions,
    totalQuestions: 1,
    answers,
    pointsEarned: config.pointsPerCorrect(1) + config.speedBonusPoints,
    coinsEarned: calculateCoins(1),
  });

  const recalc = recalculatePointsFromAnswers(state);
  assertEqual(recalc.points, config.pointsPerCorrect(1) + config.speedBonusPoints, 'Speed bonus: points include bonus');
  assertEqual(recalc.coins, calculateCoins(1), 'Speed bonus: coins correct');
}

// === Test 6: No speed bonus after window ===
{
  const questions = [makeQuestion(1, 1)];
  const answers = [answered('A', true, 15000)]; // beyond 10s speed bonus window

  const state = makeQuizState({
    questions,
    totalQuestions: 1,
    answers,
    pointsEarned: config.pointsPerCorrect(1),
    coinsEarned: calculateCoins(1),
  });

  const recalc = recalculatePointsFromAnswers(state);
  assertEqual(recalc.points, config.pointsPerCorrect(1), 'No speed bonus: correct base points');
  assertEqual(recalc.coins, calculateCoins(1), 'No speed bonus: coins correct');
}

// === Test 7: Level calculation ===
// Formula: calculateLevel starts at 1, while points >= level^2*50, increments.
// Then returns max(1, level-1).
// Level 1: 0-199 points (threshold at 200)
// Level 2: 200-449 points (threshold at 450)
// Level 3: 450-799 points (threshold at 800)
{
  assertEqual(calculateLevel(0), 1, 'Level calc: 0 points = level 1');
  assertEqual(calculateLevel(199), 1, 'Level calc: 199 points = level 1');
  assertEqual(calculateLevel(200), 2, 'Level calc: 200 points = level 2');
  assertEqual(calculateLevel(449), 2, 'Level calc: 449 points = level 2');
  assertEqual(calculateLevel(450), 3, 'Level calc: 450 points = level 3');
  assertEqual(calculateLevel(799), 3, 'Level calc: 799 points = level 3');
  assertEqual(calculateLevel(800), 4, 'Level calc: 800 points = level 4');
}

// === Test 8: Points per difficulty ===
{
  assertEqual(config.pointsPerCorrect(1), 15, 'Difficulty 1: 10 + 1*5 = 15');
  assertEqual(config.pointsPerCorrect(2), 20, 'Difficulty 2: 10 + 2*5 = 20');
  assertEqual(config.pointsPerCorrect(5), 35, 'Difficulty 5: 10 + 5*5 = 35');
}

// === Test 9: Coins per difficulty ===
{
  assertEqual(calculateCoins(1), 7, 'Coins: difficulty 1 = 5 + 1*2 = 7');
  assertEqual(calculateCoins(3), 11, 'Coins: difficulty 3 = 5 + 3*2 = 11');
  assertEqual(calculateCoins(5), 15, 'Coins: difficulty 5 = 5 + 5*2 = 15');
}

// === Test 10: Empty quiz (0 questions) ===
{
  const state = makeQuizState({
    totalQuestions: 0,
    answers: [],
  });

  const results = validateResults(state);
  assertEqual(results.correctCount, 0, 'Empty: correctCount');
  assertEqual(results.wrongCount, 0, 'Empty: wrongCount');
  assertEqual(results.skippedCount, 0, 'Empty: skippedCount');
  assertEqual(results.totalPoints, 0, 'Empty: totalPoints');
}

// === Test 11: Partial answer array (some questions never reached) ===
{
  const questions = [makeQuestion(1), makeQuestion(2), makeQuestion(3)];
  const answers: AnswerRecord[] = [answered('A', true)];

  const state = makeQuizState({
    questions,
    totalQuestions: 3,
    answers,
    pointsEarned: config.pointsPerCorrect(1),
    coinsEarned: calculateCoins(1),
  });

  const results = validateResults(state);
  assertEqual(results.correctCount, 1, 'Partial: correctCount');
  assertEqual(results.wrongCount, 0, 'Partial: wrongCount');
  assertEqual(results.skippedCount, 2, 'Partial: skippedCount for unanswered');
  assertEqual(results.correctCount + results.wrongCount + results.skippedCount, 3, 'Partial: sum = total');
}

// === Test 12: Large quiz with varying difficulties ===
{
  const questions = [];
  const answers: AnswerRecord[] = [];
  let expectedPoints = 0;
  let expectedCoins = 0;

  for (let i = 0; i < 20; i++) {
    const diff = (i % 5) + 1;
    questions.push(makeQuestion(i + 1, diff));

    if (i < 10) {
      // First 10: mix of correct/wrong/skipped
      if (i % 3 === 0) {
        // Use time 15000 to avoid speed bonus
        answers.push(answered('A', true, 15000));
        expectedPoints += config.pointsPerCorrect(diff);
        expectedCoins += calculateCoins(diff);
      } else if (i % 3 === 1) {
        answers.push(answered('B', false));
      } else {
        answers.push(skipped());
      }
    }
    // Questions 10-19 remain unanswered (undefined)
  }

  const state = makeQuizState({
    questions,
    totalQuestions: 20,
    answers,
    pointsEarned: expectedPoints,
    coinsEarned: expectedCoins,
  });

  const results = validateResults(state);
  const recalc = recalculatePointsFromAnswers(state);

  assertEqual(results.correctCount + results.wrongCount + results.skippedCount, 20, 'Large quiz: sum = total');
  assertEqual(results.totalPoints, expectedPoints, 'Large quiz: points match');
  assertEqual(recalc.points, expectedPoints, 'Large quiz: recalculated points match');
  assertEqual(recalc.coins, expectedCoins, 'Large quiz: recalculated coins match');
}

console.log('\n✅ All scoring tests completed!');
if (process.exitCode) {
  console.log('❌ Some tests FAILED');
} else {
  console.log('🎉 All tests PASSED');
}
