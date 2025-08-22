import * as NodeFs from 'node:fs/promises'
import * as NodeFsSync from 'node:fs'

export const readDir = async (path: string): Promise<readonly string[]> => {
  return NodeFs.readdir(path)
}

export const readFileSync = (path: string, encoding: 'utf8'): string => {
  return NodeFsSync.readFileSync(path, encoding)
}
