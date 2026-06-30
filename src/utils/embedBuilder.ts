import { EmbedBuilder, ColorResolvable } from 'discord.js';
import { Question } from '../types/quiz';
import { LETTER_LABELS, getCorrectAnswerLabel, getQuestionOptions } from './quizHelpers';

export function buildActiveQuizEmbed(
  question: Question,
  questionNumber: number,
  totalQuestions: number,
  remainingSeconds: number,
): EmbedBuilder {
  const difficultyStars = '⭐'.repeat(question.difficulty);
  const options = getQuestionOptions(question);

  return new EmbedBuilder()
    .setColor('#1a7c3a' as ColorResolvable)
    .setTitle(`📖 ${question.categoryNameAr || 'Islamic Quiz'}`)
    .setDescription(
      `**Question ${questionNumber}/${totalQuestions}** | Difficulty: ${difficultyStars}\n\n` +
      `> ${question.questionAr}\n\n` +
      `**⏱ Time remaining: ${remainingSeconds}s**\n\n` +
      `**${LETTER_LABELS.A}** ─ ${options.A}\n` +
      `**${LETTER_LABELS.B}** ─ ${options.B}\n` +
      `**${LETTER_LABELS.C}** ─ ${options.C}\n` +
      `**${LETTER_LABELS.D}** ─ ${options.D}\n\n` +
      'Vote using the poll below to answer.',
    )
    .setFooter({ text: 'Vote in the poll • One answer only' })
    .setTimestamp();
}

export function buildQuizRevealEmbed(
  question: Question,
  questionNumber: number,
  totalQuestions: number,
  durationMs: number,
  winnerIds: string[],
): EmbedBuilder {
  const difficultyStars = '⭐'.repeat(question.difficulty);
  const correctLabel = getCorrectAnswerLabel(question);
  const correctLetter = LETTER_LABELS[question.correctAnswer];
  const durationSeconds = Math.max(1, Math.round(durationMs / 1000));

  const winnersSection = winnerIds.length > 0
    ? winnerIds.map(id => `• <@${id}>`).join('\n')
    : 'No one answered correctly this round.';

  const explanationLine = question.source
    ? `\n📖 **Explanation:** ${question.source}\n`
    : '';

  return new EmbedBuilder()
    .setColor('#f5a623' as ColorResolvable)
    .setTitle(`📖 ${question.categoryNameAr || 'Islamic Quiz'} — Results`)
    .setDescription(
      `**Question ${questionNumber}/${totalQuestions}** | Difficulty: ${difficultyStars}\n\n` +
      `> ${question.questionAr}\n\n` +
      `✅ **Correct answer:** ${correctLetter} ─ ${correctLabel}\n` +
      explanationLine +
      `⏱ **Quiz duration:** ${durationSeconds}s\n\n` +
      `🏆 **Correct Answers**\n${winnersSection}`,
    )
    .setTimestamp();
}

export function buildFinalResultsEmbed(
  totalQuestions: number,
  correctCount: number,
  wrongCount: number,
  skippedCount: number,
  pointsEarned: number,
  coinsEarned: number,
  level: number,
  nextLevelPoints: number,
  levelUp: boolean,
  validationMsg?: string,
): EmbedBuilder {
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const grade = accuracy >= 90 ? 'Excellent 🏆' : accuracy >= 75 ? 'Very Good 🌟' : accuracy >= 50 ? 'Good 👍' : 'Keep practicing 💪';

  const description = [
    `**Correct answers:** ${correctCount}/${totalQuestions} (${accuracy}%) ✅`,
    `**Wrong answers:** ${wrongCount} ❌`,
    `**Unanswered (timeout):** ${skippedCount} ⏰`,
    '',
    `**Points earned:** +${pointsEarned} 🎯`,
    `**Coins earned:** +${coinsEarned} 🪙`,
    '',
    `**Current level:** ${level} 📈`,
    `**Points to next level:** ${nextLevelPoints} 🎯`,
    `**Grade:** ${grade}`,
    levelUp ? '# 🎉 Congratulations! You leveled up!' : '',
    validationMsg ? `\n───\n**Validation:**\n${validationMsg}` : '',
  ].filter(Boolean).join('\n');

  return new EmbedBuilder()
    .setColor(levelUp ? '#ffd700' : '#1a7c3a' as ColorResolvable)
    .setTitle('📊 Quiz Results')
    .setDescription(description)
    .setTimestamp();
}

export function buildLeaderboardEmbed(
  entries: { rank: number; username: string; points: number; level: number; correctAnswers: number }[],
  page: number,
  totalPages: number,
): EmbedBuilder {
  const medals = ['🥇', '🥈', '🥉'];
  const lines = entries.map(e => {
    const medal = e.rank <= 3 ? medals[e.rank - 1] : `${e.rank}.`;
    return `${medal} **${e.username}** — Level ${e.level} | ${e.points} pts | ${e.correctAnswers} correct`;
  });

  return new EmbedBuilder()
    .setColor('#1a7c3a' as ColorResolvable)
    .setTitle('🏆 Leaderboard')
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Page ${page}/${totalPages}` })
    .setTimestamp();
}

export function buildProfileEmbed(data: {
  username: string;
  points: number;
  coins: number;
  level: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuizzes: number;
  nextLevelPoints: number;
  rank?: number;
}): EmbedBuilder {
  const total = data.correctAnswers + data.wrongAnswers;
  const accuracy = total > 0 ? Math.round((data.correctAnswers / total) * 100) : 0;
  const rankLine = data.rank ? `**Server rank:** #${data.rank} 🏅\n` : '';

  return new EmbedBuilder()
    .setColor('#1a7c3a' as ColorResolvable)
    .setTitle(`📋 ${data.username}'s Profile`)
    .setDescription(
      rankLine +
      `**Level:** ${data.level} 📈\n` +
      `**Points:** ${data.points} 🎯\n` +
      `**Coins:** ${data.coins} 🪙\n` +
      `**Points to next level:** ${data.nextLevelPoints}\n\n` +
      `**Correct answers:** ${data.correctAnswers} ✅\n` +
      `**Wrong answers:** ${data.wrongAnswers} ❌\n` +
      `**Accuracy:** ${accuracy}%\n` +
      `**Total quizzes:** ${data.totalQuizzes} 📊`,
    )
    .setTimestamp();
}

export function buildErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#e74c3c' as ColorResolvable)
    .setTitle('⚠️ Error')
    .setDescription(message)
    .setTimestamp();
}

export function buildRankEmbed(
  username: string,
  rank: number,
  points: number,
  level: number,
  totalPlayers: number,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#1a7c3a' as ColorResolvable)
    .setTitle('🏅 Your Rank')
    .setDescription(
      `**${username}** is ranked **#${rank}** of **${totalPlayers}** players.\n\n` +
      `**Points:** ${points} 🎯\n` +
      `**Level:** ${level} 📈`,
    )
    .setTimestamp();
}
