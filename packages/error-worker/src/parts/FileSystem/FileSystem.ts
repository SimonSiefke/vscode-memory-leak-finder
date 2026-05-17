import * as NodeFsSync from 'node:fs'

export const readFileSync = (path: string, encoding: BufferEncoding): string => {
  return NodeFsSync.readFileSync(path, encoding)
}

export const existsSync = (path: string): boolean => {
  return NodeFsSync.existsSync(path)
}
