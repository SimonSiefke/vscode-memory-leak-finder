import sqlite3 from '@vscode/sqlite3'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as ExecuteSql from '../ExecuteSql/ExecuteSql.js'

/**
 * @param {import('@vscode/sqlite3').Database} db
 */
const removeItems = async (db) => {
  await ExecuteSql.executeSql(db, 'DELETE FROM ItemTable')
}

/**
 * @param {string} path
 */
export const deleteGlobalStorage = async (path) => {
  if (!existsSync(path)) {
    throw new Error(`storage not found ${path}`)
  }
  const dbPath = join(path, 'state.vscdb')
  const db = new sqlite3.Database(dbPath)
  const rows = await removeItems(db)
  return rows
}
