import { getDb, saveDb } from './connection';

export function queryOne(sql: string, params?: unknown[]): Record<string, unknown> | undefined {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  if (stmt.step()) {
    const result = stmt.getAsObject() as Record<string, unknown>;
    stmt.free();
    return result;
  }
  stmt.free();
  return undefined;
}

export function queryAll(sql: string, params?: unknown[]): Record<string, unknown>[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const results: Record<string, unknown>[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as Record<string, unknown>);
  }
  stmt.free();
  return results;
}

export function execute(sql: string, params?: unknown[]): number {
  const db = getDb();
  db.run(sql, params);
  const changes = db.getRowsModified();
  saveDb();
  return changes;
}

export function executeInsert(sql: string, params?: unknown[]): number {
  const db = getDb();
  db.run(sql, params);
  const lastId = (db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number) ?? 0;
  saveDb();
  return lastId;
}

export function executeBatch(sql: string): void {
  const db = getDb();
  db.run(sql);
  saveDb();
}

export function beginTransaction(): void {
  getDb().run('BEGIN TRANSACTION');
}

export function commitTransaction(): void {
  getDb().run('COMMIT');
  saveDb();
}

export function rollbackTransaction(): void {
  getDb().run('ROLLBACK');
}

export function execInTransaction(sql: string, params?: unknown[]): void {
  getDb().run(sql, params);
}
