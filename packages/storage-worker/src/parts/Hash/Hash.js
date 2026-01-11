import { createHash } from 'node:crypto'

/**
 * @param {any} object
 */
export const hash = (object) => {
  const string = JSON.stringify(object)
  const hash = createHash('sha1')
  hash.update(string)
  return hash.digest('hex')
}
