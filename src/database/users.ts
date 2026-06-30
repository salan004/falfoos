import { queryOne, queryAll, execute, beginTransaction, commitTransaction, rollbackTransaction, execInTransaction } from './helpers';

export function upsertUser(userId: string, guildId: string, username: string): void {
  const existing = queryOne('SELECT 1 FROM users WHERE user_id = ? AND guild_id = ?', [userId, guildId]);

  if (existing) {
    execute('UPDATE users SET username = ? WHERE user_id = ? AND guild_id = ?', [username, userId, guildId]);
  } else {
    execute(
      'INSERT INTO users (user_id, guild_id, username) VALUES (?, ?, ?)',
      [userId, guildId, username],
    );
  }
}

export function addPoints(userId: string, guildId: string, points: number): void {
  execute('UPDATE users SET points = points + ? WHERE user_id = ? AND guild_id = ?', [points, userId, guildId]);
}

export function addCoins(userId: string, guildId: string, coins: number): void {
  execute('UPDATE users SET coins = coins + ? WHERE user_id = ? AND guild_id = ?', [coins, userId, guildId]);
}

export function addCorrectAnswer(userId: string, guildId: string): void {
  execute('UPDATE users SET correct_answers = correct_answers + 1 WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
}

export function addWrongAnswer(userId: string, guildId: string): void {
  execute('UPDATE users SET wrong_answers = wrong_answers + 1 WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
}

export function incrementTotalQuizzes(userId: string, guildId: string): void {
  execute('UPDATE users SET total_quizzes = total_quizzes + 1 WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
}

export function setLevel(userId: string, guildId: string, level: number): void {
  execute('UPDATE users SET level = ? WHERE user_id = ? AND guild_id = ?', [level, userId, guildId]);
}

export function getUser(userId: string, guildId: string) {
  const row = queryOne('SELECT * FROM users WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
  if (!row) return undefined;

  return {
    user_id: row.user_id as string,
    guild_id: row.guild_id as string,
    username: row.username as string,
    points: row.points as number,
    coins: row.coins as number,
    level: row.level as number,
    correct_answers: row.correct_answers as number,
    wrong_answers: row.wrong_answers as number,
    total_quizzes: row.total_quizzes as number,
  };
}

export function applyQuizResultsInTransaction(
  userId: string,
  guildId: string,
  username: string,
  results: {
    correctCount: number;
    wrongCount: number;
    skippedCount: number;
    pointsEarned: number;
    coinsEarned: number;
  },
): void {
  try {
    beginTransaction();

    const existing = queryOne('SELECT 1 FROM users WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
    if (existing) {
      execInTransaction('UPDATE users SET username = ? WHERE user_id = ? AND guild_id = ?', [username, userId, guildId]);
    } else {
      execInTransaction(
        'INSERT INTO users (user_id, guild_id, username) VALUES (?, ?, ?)',
        [userId, guildId, username],
      );
    }

    execInTransaction(
      'UPDATE users SET correct_answers = correct_answers + ?, wrong_answers = wrong_answers + ?, points = points + ?, coins = coins + ?, total_quizzes = total_quizzes + 1 WHERE user_id = ? AND guild_id = ?',
      [results.correctCount, results.wrongCount, results.pointsEarned, results.coinsEarned, userId, guildId],
    );

    commitTransaction();
  } catch (err) {
    try { rollbackTransaction(); } catch (_) { /* no active transaction */ }
    throw err;
  }
}

export function recalculateUserFromSessions(userId: string, guildId: string): void {
  try {
    beginTransaction();

    const stats = queryOne(
      `SELECT
        COALESCE(SUM(correct_count), 0) as total_correct,
        COALESCE(SUM(wrong_count), 0) as total_wrong,
        COALESCE(SUM(points_earned), 0) as total_points,
        COALESCE(SUM(coins_earned), 0) as total_coins,
        COUNT(*) as total_quizzes
       FROM quiz_sessions
       WHERE user_id = ? AND guild_id = ? AND status = 'completed'`,
      [userId, guildId],
    );

    const upsertResult = queryOne('SELECT 1 FROM users WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
    if (!upsertResult) {
      execInTransaction(
        'INSERT INTO users (user_id, guild_id, username, points, coins, correct_answers, wrong_answers, total_quizzes, level) VALUES (?, ?, \'\', ?, ?, ?, ?, ?, 1)',
        [
          userId,
          guildId,
          (stats?.total_points as number) || 0,
          (stats?.total_coins as number) || 0,
          (stats?.total_correct as number) || 0,
          (stats?.total_wrong as number) || 0,
          (stats?.total_quizzes as number) || 0,
        ],
      );
    } else {
      execInTransaction(
        'UPDATE users SET correct_answers = ?, wrong_answers = ?, points = ?, coins = ?, total_quizzes = ? WHERE user_id = ? AND guild_id = ?',
        [
          (stats?.total_correct as number) || 0,
          (stats?.total_wrong as number) || 0,
          (stats?.total_points as number) || 0,
          (stats?.total_coins as number) || 0,
          (stats?.total_quizzes as number) || 0,
          userId,
          guildId,
        ],
      );
    }

    const userRow = queryOne('SELECT points FROM users WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
    if (userRow) {
      const points = userRow.points as number;
      let level = 1;
      while (points >= level * level * 50) {
        level++;
      }
      level = Math.max(1, level - 1);
      execInTransaction('UPDATE users SET level = ? WHERE user_id = ? AND guild_id = ?', [level, userId, guildId]);
    }

    commitTransaction();
  } catch (err) {
    rollbackTransaction();
    throw err;
  }
}

export function getLeaderboard(guildId: string, limit: number, offset: number) {
  const rows = queryAll(
    `SELECT user_id, username, points, level, correct_answers
     FROM users
     WHERE guild_id = ?
     ORDER BY points DESC
     LIMIT ? OFFSET ?`,
    [guildId, limit, offset],
  );

  return rows.map(r => ({
    user_id: r.user_id as string,
    username: r.username as string,
    points: r.points as number,
    level: r.level as number,
    correct_answers: r.correct_answers as number,
  }));
}

export function getLeaderboardCount(guildId: string): number {
  const row = queryOne('SELECT COUNT(*) as count FROM users WHERE guild_id = ?', [guildId]);
  return (row?.count as number) || 0;
}

export function getUserRank(userId: string, guildId: string): { rank: number; totalPlayers: number } | null {
  const user = getUser(userId, guildId);
  if (!user) return null;

  const totalPlayers = getLeaderboardCount(guildId);
  const row = queryOne(
    `SELECT COUNT(*) + 1 as rank
     FROM users
     WHERE guild_id = ? AND (
       points > ? OR (points = ? AND correct_answers > ?) OR (points = ? AND correct_answers = ? AND user_id < ?)
     )`,
    [guildId, user.points, user.points, user.correct_answers, user.points, user.correct_answers, userId],
  );

  return {
    rank: (row?.rank as number) || 1,
    totalPlayers,
  };
}
