import { ChatInputCommandInteraction } from 'discord.js';
import { getUser, getUserRank, upsertUser } from '../database/users';
import { getNextLevelPoints } from '../services/levelService';
import { buildProfileEmbed } from '../utils/embedBuilder';

export async function handleProfileCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const userId = interaction.user.id;
  const guildId = interaction.guildId!;

  upsertUser(userId, guildId, interaction.user.username);
  const user = getUser(userId, guildId);

  if (!user) {
    await interaction.editReply({ content: '❌ الملف الشخصي غير موجود. شارك في مسابقة أولاً!' });
    return;
  }

  const rankInfo = getUserRank(userId, guildId);
  const nextLevelPoints = getNextLevelPoints(user.level + 1);

  const embed = buildProfileEmbed({
    username: user.username || interaction.user.username,
    points: user.points,
    coins: user.coins,
    level: user.level,
    correctAnswers: user.correct_answers,
    wrongAnswers: user.wrong_answers,
    totalQuizzes: user.total_quizzes,
    nextLevelPoints,
    rank: rankInfo?.rank,
    currentStreak: user.current_streak || 0,
    bestStreak: user.best_streak || 0,
    firstPlace: user.first_place || 0,
    secondPlace: user.second_place || 0,
    thirdPlace: user.third_place || 0,
    totalWins: user.total_wins || 0,
  });

  await interaction.editReply({ embeds: [embed] });
}
