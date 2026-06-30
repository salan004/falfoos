import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { isAdmin } from './permissions';

export async function requireAdmin(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const member = interaction.member;
  if (!member || !(member instanceof GuildMember) || !isAdmin(member)) {
    const content = '❌ This command is restricted to administrators.';
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content }).catch(() => {});
    } else {
      await interaction.reply({ content, ephemeral: true }).catch(() => {});
    }
    return false;
  }
  return true;
}
