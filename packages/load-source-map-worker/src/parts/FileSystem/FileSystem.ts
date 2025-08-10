import * as NodeFs from 'node:fs/promises'
import * as NodeFsSync from 'node:fs'

export const readDir = (path: string): Promise<string[]> => {
  return NodeFs.readdir(path)
}

/**
 *
 * @param {string} path
 * @param {BufferEncoding} encoding
 * @returns {string}
 */
export const readFileSync = (path: string, encoding: BufferEncoding): string => {
  return NodeFsSync.readFileSync(path, encoding)
}
