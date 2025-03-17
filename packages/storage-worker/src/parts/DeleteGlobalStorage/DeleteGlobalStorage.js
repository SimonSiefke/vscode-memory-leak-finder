import sqlite3 from "@vscode/sqlite3";
import { existsSync } from "fs";
import { join } from "path";
import * as ExecuteSql from "../ExecuteSql/ExecuteSql.js";

const removeItems = async (db) => {
  await ExecuteSql.executeSql(db, "DELETE FROM ItemTable");
};

export const deleteGlobalStorage = async (path) => {
  if (!existsSync(path)) {
    throw new Error(`storage not found ${path}`);
  }
  const dbPath = join(path, "state.vscdb");
  const db = new sqlite3.Database(dbPath);
  const rows = await removeItems(db);
  return rows;
};
