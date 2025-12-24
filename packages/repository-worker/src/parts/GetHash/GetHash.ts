import { createHash } from 'node:crypto'

/**
 * Generates a SHA1 hash from an array of strings or buffers
 */
export const getHash = (contents: Array<string | Buffer>): string => {
  const hash = createHash('sha1')
  for (const content of contents) {
    hash.update(content)
  }
  return hash.digest('hex')
}
