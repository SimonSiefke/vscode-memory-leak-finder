import * as NodeFs from 'node:fs/promises'
import * as NodeFsSync from 'node:fs'

export const readDir = (path) => {
  return NodeFs.readdir(path)
}

/**
 *
 * @param {string} path
 * @param {BufferEncoding} encoding
 * @returns {string}
 */
export const readFileSync = (path, encoding) => {
  return NodeFsSync.readFileSync(path, encoding)
}
