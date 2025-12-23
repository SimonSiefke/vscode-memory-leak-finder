/**
 * @param {import('@vscode/sqlite3').Database} db
 * @param {string} statement
 */
export const executeSql = async (db, statement) => {
  const { resolve, reject, promise } = Promise.withResolvers()
  /**
   * @param {Error | null} error
   * @param {any[]} rows
   */
  db.all(statement, (error, rows) => {
    if (error) {
      reject(new Error(`failed to execute sql: ${error}`))
    }
    resolve(rows)
  })
  const rows = await promise
  return rows
}
