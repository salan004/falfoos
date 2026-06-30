import {
  Collection,
  Message,
  PollAnswer,
  TextChannel,
} from 'discord.js';
import { config } from '../config';
import { QuizState, AnswerRecord, QuestionRoundState } from '../types/quiz';
import { getRandomQuestion } from '../database/questions';
import {
  upsertUser,
  getUser,
} from '../database/users';
import { calculateLevel } from './levelService';
import { calculateCoins } from './coinService';
import {
  buildActiveQuizEmbed,
  buildQuizRevealEmbed,
  buildFinalResultsEmbed,
  buildErrorEmbed,
} from '../utils/embedBuilder';
import {
  ANSWER_ID_MAP,
  ANSWER_ID_TO_LETTER,
  ANSWER_LETTERS,
  getQuestionOptions,
  truncatePollText,
} from '../utils/quizHelpers';
import {
  execInTransaction,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  queryOne,
  queryAll,
} from '../database/helpers';

const activeQuizzes = new Collection<string, QuizState>();
const messageQuizMap = new Collection<string, string>();

function getChannelQuizKey(guildId: string, channelId: string): string {
  return `${guildId}:${channelId}`;
}

function createRoundState(): QuestionRoundState {
  return {
    votes: new Map(),
    rewardedUsers: new Set(),
    ended: false,
    questionStartedAt: Date.now(),
    timerInterval: null,
    endTimeout: null,
  };
}

function clearRoundTimers(round: QuestionRoundState | null): void {
  if (!round) return;
  if (round.timerInterval) {
    clearInterval(round.timerInterval);
    round.timerInterval = null;
  }
  if (round.endTimeout) {
    clearTimeout(round.endTimeout);
    round.endTimeout = null;
  }
}

export function isQuizActiveInChannel(guildId: string, channelId: string): boolean {
  const quiz = activeQuizzes.get(getChannelQuizKey(guildId, channelId));
  return quiz !== undefined && quiz.status === 'active';
}

export function getActiveQuizByChannel(guildId: string, channelId: string): QuizState | undefined {
  return activeQuizzes.get(getChannelQuizKey(guildId, channelId));
}

export function getQuizByMessageId(messageId: string): QuizState | undefined {
  const key = messageQuizMap.get(messageId);
  return key ? activeQuizzes.get(key) : undefined;
}

export function handlePollVoteAdd(answer: PollAnswer, userId: string): void {
  const messageId = answer.poll.messageId;
  const quiz = getQuizByMessageId(messageId);
  if (!quiz || !quiz.round || quiz.round.ended) return;

  quiz.round.votes.set(userId, {
    answerId: answer.id,
    votedAt: Date.now(),
  });
}

export function handlePollVoteRemove(answer: PollAnswer, userId: string): void {
  const messageId = answer.poll.messageId;
  const quiz = getQuizByMessageId(messageId);
  if (!quiz || !quiz.round || quiz.round.ended) return;

  const existing = quiz.round.votes.get(userId);
  if (existing && existing.answerId === answer.id) {
    quiz.round.votes.delete(userId);
  }
}

export async function startQuiz(
  channel: TextChannel,
  userId: string,
  totalQuestions: number = 5,
  categoryId?: number,
): Promise<void> {
  const guildId = channel.guildId;

  if (isQuizActiveInChannel(guildId, channel.id)) {
    await channel.send({
      embeds: [buildErrorEmbed('There is already an active quiz in this channel.')],
    });
    return;
  }

  totalQuestions = Math.min(totalQuestions, config.maxQuestionsPerQuiz);
  const questions: QuizState['questions'] = [];

  for (let i = 0; i < totalQuestions; i++) {
    const q = getRandomQuestion(categoryId);
    if (q && !questions.find(ex => ex.id === q.id)) {
      questions.push(q);
    }
  }

  if (questions.length === 0) {
    await channel.send({ embeds: [buildErrorEmbed('No questions are available right now.')] });
    return;
  }

  const startUser = getUser(userId, guildId);
  const key = getChannelQuizKey(guildId, channel.id);

  const quizState: QuizState = {
    guildId,
    channelId: channel.id,
    userId,
    questions,
    currentIndex: 0,
    totalQuestions: questions.length,
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
    preQuizUserSnapshot: startUser
      ? {
          points: startUser.points,
          coins: startUser.coins,
          level: startUser.level,
          correct_answers: startUser.correct_answers,
          wrong_answers: startUser.wrong_answers,
        }
      : null,
  };

  activeQuizzes.set(key, quizState);
  await sendNextQuestion(channel, quizState);
}

export async function skipCurrentQuestion(channel: TextChannel, requesterId: string): Promise<boolean> {
  const quiz = getActiveQuizByChannel(channel.guildId, channel.id);
  if (!quiz || quiz.status !== 'active') {
    return false;
  }

  if (requesterId !== quiz.userId) {
    const requester = await channel.guild.members.fetch(requesterId).catch(() => null);
    if (!requester?.permissions.has('Administrator')) {
      return false;
    }
  }

  if (!quiz.round || quiz.round.ended) {
    return false;
  }

  await endQuestionRound(channel, quiz, 'skipped');
  return true;
}

async function sendNextQuestion(channel: TextChannel, quizState: QuizState): Promise<void> {
  if (quizState.currentIndex >= quizState.questions.length) {
    await finishQuiz(channel, quizState);
    return;
  }

  const question = quizState.questions[quizState.currentIndex];
  const totalSeconds = Math.floor(config.quizTimeLimit / 1000);
  const round = createRoundState();
  quizState.round = round;
  round.questionStartedAt = Date.now();

  const pollAnswers = ANSWER_LETTERS.map(letter => ({
    text: truncatePollText(getQuestionOptions(question)[letter]),
  }));

  let message: Message;
  try {
    message = await channel.send({
      embeds: [buildActiveQuizEmbed(question, quizState.currentIndex + 1, quizState.totalQuestions, totalSeconds)],
      poll: {
        question: { text: truncatePollText(question.questionAr, 300) },
        answers: pollAnswers,
        duration: 24,
        allowMultiselect: false,
      },
    });
  } catch (err) {
    console.error('[QUIZ ERROR] Failed to send poll message:', err);
    await channel.send({
      embeds: [buildErrorEmbed('Failed to start the quiz poll. Ensure the bot has permission to create polls.')],
    });
    activeQuizzes.delete(getChannelQuizKey(quizState.guildId, quizState.channelId));
    return;
  }

  quizState.messageId = message.id;
  messageQuizMap.set(message.id, getChannelQuizKey(quizState.guildId, quizState.channelId));

  let remainingSeconds = totalSeconds;

  round.timerInterval = setInterval(async () => {
    remainingSeconds--;
    if (remainingSeconds <= 0) {
      clearRoundTimers(round);
      if (!round.ended) {
        await endQuestionRound(channel, quizState, 'timeout');
      }
      return;
    }

    try {
      await message.edit({
        embeds: [buildActiveQuizEmbed(question, quizState.currentIndex + 1, quizState.totalQuestions, remainingSeconds)],
      });
    } catch {
      clearRoundTimers(round);
    }
  }, 1000);

  round.endTimeout = setTimeout(async () => {
    if (!round.ended) {
      await endQuestionRound(channel, quizState, 'timeout');
    }
  }, config.quizTimeLimit);
}

async function endQuestionRound(
  channel: TextChannel,
  quizState: QuizState,
  reason: 'timeout' | 'skipped',
): Promise<void> {
  const round = quizState.round;
  if (!round || round.ended) return;

  round.ended = true;
  clearRoundTimers(round);

  const question = quizState.questions[quizState.currentIndex];
  const questionIndex = quizState.currentIndex;
  const durationMs = Date.now() - round.questionStartedAt;
  const correctAnswerId = ANSWER_ID_MAP[question.correctAnswer];

  let message: Message | null = null;
  if (quizState.messageId) {
    message = await channel.messages.fetch(quizState.messageId).catch(() => null);
    if (message?.poll && !message.poll.resultsFinalized) {
      try {
        await message.poll.end();
      } catch (err) {
        console.error('[QUIZ ERROR] Failed to end poll:', err);
      }
    }
  }

  const winnerIds = getCorrectVoters(round, correctAnswerId, round.questionStartedAt + config.quizTimeLimit);
  await awardWinners(channel, quizState, question, winnerIds);

  const starterVote = round.votes.get(quizState.userId);
  const starterAnswer = starterVote ? ANSWER_ID_TO_LETTER[starterVote.answerId] : null;
  const starterCorrect = starterAnswer === question.correctAnswer;

  quizState.answers[questionIndex] = {
    answer: starterAnswer,
    isCorrect: starterCorrect,
    time: starterVote ? starterVote.votedAt - round.questionStartedAt : config.quizTimeLimit,
    status: starterVote ? 'answered' : 'skipped',
  };

  if (message) {
    try {
      await message.edit({
        embeds: [
          buildQuizRevealEmbed(
            question,
            quizState.currentIndex + 1,
            quizState.totalQuestions,
            durationMs,
            winnerIds,
          ),
        ],
      });
    } catch (err) {
      console.error('[QUIZ ERROR] Failed to update quiz message:', err);
    }
  }

  if (reason === 'skipped') {
    await channel.send('⏭️ Question skipped. Moving to the next question...').catch(() => {});
  }

  if (quizState.messageId) {
    messageQuizMap.delete(quizState.messageId);
  }
  quizState.messageId = null;
  quizState.round = null;
  quizState.currentIndex++;

  await sendNextQuestion(channel, quizState);
}

function getCorrectVoters(
  round: QuestionRoundState,
  correctAnswerId: number,
  deadline: number,
): string[] {
  const winners: string[] = [];

  for (const [userId, vote] of round.votes.entries()) {
    if (vote.answerId === correctAnswerId && vote.votedAt <= deadline) {
      winners.push(userId);
    }
  }

  return winners;
}

async function awardWinners(
  channel: TextChannel,
  quizState: QuizState,
  question: QuizState['questions'][number],
  winnerIds: string[],
): Promise<void> {
  const round = quizState.round;
  if (!round) return;

  for (const userId of winnerIds) {
    if (round.rewardedUsers.has(userId)) continue;

    const vote = round.votes.get(userId);
    if (!vote) continue;

    round.rewardedUsers.add(userId);

    const responseTime = vote.votedAt - round.questionStartedAt;
    const isSpeedBonus = responseTime <= config.speedBonusWindow;
    let earnedPoints = config.pointsPerCorrect(question.difficulty);
    if (isSpeedBonus) earnedPoints += config.speedBonusPoints;
    const earnedCoins = calculateCoins(question.difficulty);

    quizState.totalPointsAwarded += earnedPoints;
    quizState.totalCoinsAwarded += earnedCoins;

    if (userId === quizState.userId) {
      quizState.pointsEarned += earnedPoints;
      quizState.coinsEarned += earnedCoins;
    }

    try {
      const member = await channel.guild.members.fetch(userId).catch(() => null);
      const username = member?.user.username || 'User';
      upsertUser(userId, quizState.guildId, username);

      beginTransaction();
      execInTransaction(
        `UPDATE users SET
          correct_answers = correct_answers + 1,
          points = points + ?,
          coins = coins + ?
         WHERE user_id = ? AND guild_id = ?`,
        [earnedPoints, earnedCoins, userId, quizState.guildId],
      );

      const userRow = queryOne(
        'SELECT points, level FROM users WHERE user_id = ? AND guild_id = ?',
        [userId, quizState.guildId],
      );

      if (userRow) {
        const newLevel = calculateLevel(userRow.points as number);
        if (newLevel !== (userRow.level as number)) {
          execInTransaction(
            'UPDATE users SET level = ? WHERE user_id = ? AND guild_id = ?',
            [newLevel, userId, quizState.guildId],
          );
        }
      }

      commitTransaction();
    } catch (err) {
      console.error('[QUIZ ERROR] Failed to award points:', err);
      try { rollbackTransaction(); } catch (_) { /* no active transaction */ }
    }
  }

  for (const [userId] of round.votes.entries()) {
    if (winnerIds.includes(userId)) continue;

    try {
      const member = await channel.guild.members.fetch(userId).catch(() => null);
      const username = member?.user.username || 'User';
      upsertUser(userId, quizState.guildId, username);

      beginTransaction();
      execInTransaction(
        'UPDATE users SET wrong_answers = wrong_answers + 1 WHERE user_id = ? AND guild_id = ?',
        [userId, quizState.guildId],
      );
      commitTransaction();
    } catch (err) {
      console.error('[QUIZ ERROR] Failed to record wrong answer:', err);
      try { rollbackTransaction(); } catch (_) { /* no active transaction */ }
    }
  }
}

export function validateResults(quizState: QuizState): {
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalPoints: number;
  totalCoins: number;
} {
  const totalQuestions = quizState.totalQuestions;

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < totalQuestions; i++) {
    const record = quizState.answers[i];
    if (!record || record.status === 'skipped') {
      skippedCount++;
    } else if (record.isCorrect) {
      correctCount++;
    } else {
      wrongCount++;
    }
  }

  const validationSum = correctCount + wrongCount + skippedCount;
  if (validationSum !== totalQuestions) {
    console.error(
      `[VALIDATION FAILED] Quiz ${quizState.channelId}: correct(${correctCount}) + wrong(${wrongCount}) + skipped(${skippedCount}) = ${validationSum} !== total(${totalQuestions})`,
    );
  }

  return {
    correctCount,
    wrongCount,
    skippedCount,
    totalPoints: quizState.pointsEarned,
    totalCoins: quizState.coinsEarned,
  };
}

export function recalculatePointsFromAnswers(quizState: QuizState): { points: number; coins: number } {
  let points = 0;
  let coins = 0;

  for (let i = 0; i < quizState.totalQuestions; i++) {
    const record = quizState.answers[i];
    if (!record || record.status === 'skipped' || !record.isCorrect) continue;

    const q = quizState.questions[i];
    let pts = config.pointsPerCorrect(q.difficulty);
    if (record.time <= config.speedBonusWindow) pts += config.speedBonusPoints;
    points += pts;
    coins += calculateCoins(q.difficulty);
  }

  return { points, coins };
}

async function finishQuiz(channel: TextChannel, quizState: QuizState): Promise<void> {
  const key = getChannelQuizKey(quizState.guildId, quizState.channelId);
  quizState.status = 'completed';
  clearRoundTimers(quizState.round);

  const results = validateResults(quizState);
  const recalculated = recalculatePointsFromAnswers(quizState);

  const earnedPoints = Math.max(results.totalPoints, recalculated.points);
  const earnedCoins = Math.max(results.totalCoins, recalculated.coins);

  try {
    beginTransaction();

    execInTransaction(
      `INSERT INTO quiz_sessions (guild_id, channel_id, user_id, total_questions, correct_count, wrong_count, skipped_count, points_earned, coins_earned, status, started_at, ended_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'), datetime('now'))`,
      [
        quizState.guildId,
        quizState.channelId,
        quizState.userId,
        quizState.totalQuestions,
        results.correctCount,
        results.wrongCount,
        results.skippedCount,
        quizState.totalPointsAwarded,
        quizState.totalCoinsAwarded,
      ],
    );

    const sessionId = queryOne('SELECT last_insert_rowid() as id')?.id as number;
    quizState.sessionId = sessionId;

    for (let i = 0; i < quizState.totalQuestions; i++) {
      const record = quizState.answers[i];
      if (!record || record.status === 'skipped') {
        execInTransaction(
          `INSERT INTO quiz_answers (session_id, user_id, question_id, selected_answer, is_correct, status, answered_at)
           VALUES (?, ?, ?, NULL, 0, 'skipped', datetime('now'))`,
          [sessionId, quizState.userId, quizState.questions[i].id],
        );
      } else {
        execInTransaction(
          `INSERT INTO quiz_answers (session_id, user_id, question_id, selected_answer, is_correct, status, answered_at)
           VALUES (?, ?, ?, ?, ?, 'answered', datetime('now'))`,
          [sessionId, quizState.userId, quizState.questions[i].id, record.answer, record.isCorrect ? 1 : 0],
        );
      }
    }

    execInTransaction(
      'UPDATE users SET total_quizzes = total_quizzes + 1 WHERE user_id = ? AND guild_id = ?',
      [quizState.userId, quizState.guildId],
    );

    commitTransaction();
  } catch (err) {
    console.error('[QUIZ TRANSACTION ERROR]', err);
    try { rollbackTransaction(); } catch (_) { /* already committed or no transaction active */ }
    await channel.send({ embeds: [buildErrorEmbed('An error occurred while saving quiz results. Please try again.')] }).catch(() => {});
    activeQuizzes.delete(key);
    return;
  }

  const finalRow = queryOne(
    'SELECT level, points FROM users WHERE user_id = ? AND guild_id = ?',
    [quizState.userId, quizState.guildId],
  );
  const finalLevel = finalRow ? (finalRow.level as number) : 1;
  const previousLevel = quizState.preQuizUserSnapshot?.level || 1;
  const levelUp = finalLevel > previousLevel;
  const nextLevelPoints = (finalLevel + 1) * (finalLevel + 1) * 50;

  const validationMsg = buildValidationMessage(quizState, results);

  const finalEmbed = buildFinalResultsEmbed(
    quizState.totalQuestions,
    results.correctCount,
    results.wrongCount,
    results.skippedCount,
    earnedPoints,
    earnedCoins,
    finalLevel,
    nextLevelPoints,
    levelUp,
    validationMsg,
  );

  try {
    await channel.send({ embeds: [finalEmbed] });
  } catch (err) {
    console.error('[QUIZ ERROR] Failed to send results embed:', err);
  }

  if (levelUp) {
    try {
      await channel.send({
        content: `<@${quizState.userId}> **🎉 Congratulations! You reached level ${finalLevel}!**`,
      });
    } catch (err) {
      console.error('[QUIZ ERROR] Failed to send level-up message:', err);
    }
  }

  activeQuizzes.delete(key);
}

function buildValidationMessage(
  quizState: QuizState,
  results: ReturnType<typeof validateResults>,
): string {
  const totalQuestions = quizState.totalQuestions;
  const sum = results.correctCount + results.wrongCount + results.skippedCount;
  const messages: string[] = [];

  if (sum !== totalQuestions) {
    messages.push(
      `❌ Mismatch: correct(${results.correctCount}) + wrong(${results.wrongCount}) + skipped(${results.skippedCount}) = ${sum} ≠ ${totalQuestions}`,
    );
  }

  const emptyQuestions: number[] = [];
  for (let i = 0; i < totalQuestions; i++) {
    if (!quizState.answers[i]) {
      emptyQuestions.push(i + 1);
    }
  }
  if (emptyQuestions.length > 0) {
    messages.push(`⚠️ Unrecorded questions: ${emptyQuestions.join(', ')}`);
  }

  if (messages.length === 0) {
    messages.push('✅ All statistics match');
  }

  return messages.join('\n');
}

export function recalculateQuizFromDb(sessionId: number): {
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalQuestions: number;
  pointsEarned: number;
  coinsEarned: number;
} | null {
  const sessionRow = queryOne('SELECT * FROM quiz_sessions WHERE id = ?', [sessionId]);

  if (!sessionRow) return null;

  const answers = queryAll(
    'SELECT * FROM quiz_answers WHERE session_id = ?',
    [sessionId],
  );

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  for (const a of answers) {
    const status = a.status as string;
    if (status === 'skipped') {
      skippedCount++;
    } else if ((a.is_correct as number) === 1) {
      correctCount++;
    } else {
      wrongCount++;
    }
  }

  return {
    correctCount,
    wrongCount,
    skippedCount,
    totalQuestions: sessionRow.total_questions as number,
    pointsEarned: sessionRow.points_earned as number,
    coinsEarned: sessionRow.coins_earned as number,
  };
}
