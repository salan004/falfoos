import { Events } from 'discord.js';
import { client } from '../client';

export function registerReadyEvent(): void {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`✅ البوت جاهز! تم تسجيل الدخول كـ ${readyClient.user.tag}`);
    readyClient.user.setActivity('المسابقات الإسلامية | /مسابقة', { type: 0 });
  });
}
