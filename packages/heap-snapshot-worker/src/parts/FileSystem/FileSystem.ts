import * as NodeFsSync from 'node:fs'
import * as NodeFs from 'node:fs/promises'

export const readDir = (path) => {
  return NodeFs.readdir(path)
}

export const readFileSync = (path, encoding) => {
  return NodeFsSync.readFileSync(path, encoding)
}
