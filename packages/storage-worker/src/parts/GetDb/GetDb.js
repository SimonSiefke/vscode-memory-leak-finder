import sqlite3 from '@vscode/sqlite3'

export const getDb = async (path) => {
  const db = new sqlite3.Database(path)
  return db
}
