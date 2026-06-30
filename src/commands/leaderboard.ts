import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getLeaderboard, getLeaderboardCount } from '../database/users';
import { config } from '../config';
import { buildLeaderboardEmbed } from '../utils/embedBuilder';

export async function handleLeaderboardCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const page = interaction.options.getInteger('page') ?? interaction.options.getInteger('الصفحة') ?? 1;
  const pageSize = config.leaderboardPageSize;
  const offset = (page - 1) * pageSize;

  const total = getLeaderboardCount(interaction.guildId!);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total === 0) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#1a7c3a' as any)
          .setTitle('🏆 قائمة المتصدرين')
          .setDescription('لا يوجد مشاركون بعد. ابدأ المسابقات واكسب النقاط!')
          .setTimestamp(),
      ],
    });
    return;
  }

  if (page < 1 || page > totalPages) {
    await interaction.editReply({ content: `❌ الصفحة غير صالحة. الصفحات المتاحة: 1-${totalPages}` });
    return;
  }

  const entries = getLeaderboard(interaction.guildId!, pageSize, offset);

  const rankedEntries = entries.map((e, i) => ({
    rank: offset + i + 1,
    username: e.username || 'مستخدم',
    points: e.points,
    level: e.level,
    correctAnswers: e.correct_answers,
    wrongAnswers: e.wrong_answers,
    firstPlace: e.first_place,
  }));

  const embed = buildLeaderboardEmbed(rankedEntries, page, totalPages);
  await interaction.editReply({ embeds: [embed] });
}
