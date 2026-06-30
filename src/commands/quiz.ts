import { ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { startQuiz } from '../services/quizService';

function getQuizOptions(interaction: ChatInputCommandInteraction): {
  totalQuestions: number;
  categoryId?: number;
} {
  const totalQuestions =
    interaction.options.getInteger('questions') ??
    interaction.options.getInteger('عدد_الأسئلة') ??
    5;

  const categoryStr =
    interaction.options.getString('category') ??
    interaction.options.getString('التصنيف');

  const categoryId = categoryStr ? parseInt(categoryStr, 10) : undefined;
  return { totalQuestions, categoryId };
}

export async function handleQuizCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const { totalQuestions, categoryId } = getQuizOptions(interaction);

  const channel = interaction.channel;
  if (!channel || !channel.isTextBased() || !(channel instanceof TextChannel)) {
    await interaction.editReply({ content: '❌ This command must be used in a text channel.' });
    return;
  }

  await interaction.editReply({
    content: `📖 **Quiz started!** ${totalQuestions} question(s).\nCheck ${channel} to vote in the poll.`,
  });

  await startQuiz(channel, interaction.user.id, totalQuestions, categoryId);
}
