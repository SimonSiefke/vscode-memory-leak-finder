import * as NodeFsSync from 'node:fs'
import * as NodeFs from 'node:fs/promises'

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
