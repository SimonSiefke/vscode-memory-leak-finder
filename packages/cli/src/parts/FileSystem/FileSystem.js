import * as NodeFs from 'node:fs/promises'

export const readDir = (path) => {
  return NodeFs.readdir(path)
}
