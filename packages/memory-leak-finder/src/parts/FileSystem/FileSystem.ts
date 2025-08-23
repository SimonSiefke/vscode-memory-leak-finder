import * as NodeFsSync from 'node:fs'
import * as NodeFs from 'node:fs/promises'

export const readDir = (path: string) => {
  return NodeFs.readdir(path)
}

export const readFileSync = (path: string, encoding: 'utf8'): string => {
  return NodeFsSync.readFileSync(path, encoding)
}
