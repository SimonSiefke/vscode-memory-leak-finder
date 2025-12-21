import * as NodeFs from 'node:fs/promises'
import * as NodeFsSync from 'node:fs'

export const readDir = (path) => {
  return NodeFs.readdir(path)
}

export const readFileSync = (path, encoding) => {
  return NodeFsSync.readFileSync(path, encoding)
}
