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
    await interaction.editReply({ content: '❌ Profile not found. Join a quiz first!' });
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
  });

  await interaction.editReply({ embeds: [embed] });
}
