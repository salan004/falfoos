import { executeBatch } from './helpers';

export function initializeSchema(): void {
  executeBatch(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_ar TEXT NOT NULL UNIQUE,
      name_en TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      question_ar TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL CHECK(correct_answer IN ('A','B','C','D')),
      difficulty INTEGER DEFAULT 1 CHECK(difficulty BETWEEN 1 AND 5),
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      username TEXT DEFAULT '',
      points INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      correct_answers INTEGER DEFAULT 0,
      wrong_answers INTEGER DEFAULT 0,
      total_quizzes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, guild_id)
    );

    CREATE TABLE IF NOT EXISTS quiz_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      total_questions INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      wrong_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      points_earned INTEGER NOT NULL DEFAULT 0,
      coins_earned INTEGER NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','cancelled')),
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS quiz_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      selected_answer TEXT,
      is_correct BOOLEAN,
      status TEXT NOT NULL DEFAULT 'answered' CHECK(status IN ('answered','skipped')),
      answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);
    CREATE INDEX IF NOT EXISTS idx_users_guild ON users(guild_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_guild ON quiz_sessions(guild_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON quiz_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_answers_session ON quiz_answers(session_id);
  `);
}
