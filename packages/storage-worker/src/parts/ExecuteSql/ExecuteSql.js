export const executeSql = async (db, statement) => {
  const { resolve, reject, promise } = Promise.withResolvers()
  db.all(statement, (error, rows) => {
    if (error) {
      reject(new Error(`failed to execute sql: ${error}`))
    }
    resolve(rows)
  })
  const rows = await promise
  return rows
}
