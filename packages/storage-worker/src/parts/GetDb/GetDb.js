import sqlite3 from '@vscode/sqlite3'

/**
 * @param {string} path
 */
export const getDb = async (path) => {
  const db = new sqlite3.Database(path)
  return db
}
