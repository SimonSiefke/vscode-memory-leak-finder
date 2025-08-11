import * as NodeFs from 'node:fs/promises'
import * as NodeFsSync from 'node:fs'

export const readDir = (path: string) => {
  return NodeFs.readdir(path)
}

export const readFileSync = (path: string, encoding: BufferEncoding): string => {
  return NodeFsSync.readFileSync(path, encoding)
}
