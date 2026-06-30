import { Events, PollAnswer } from 'discord.js';
import { client } from '../client';
import { handlePollVoteAdd, handlePollVoteRemove } from '../services/quizService';

export function registerPollVoteEvents(): void {
  client.on(Events.MessagePollVoteAdd, (answer, userId) => {
    if (!isFullPollAnswer(answer)) return;
    handlePollVoteAdd(answer, userId);
  });

  client.on(Events.MessagePollVoteRemove, (answer, userId) => {
    if (!isFullPollAnswer(answer)) return;
    handlePollVoteRemove(answer, userId);
  });
}

function isFullPollAnswer(answer: PollAnswer | { partial?: boolean }): answer is PollAnswer {
  return !('partial' in answer && answer.partial);
}
