import { createHash } from 'node:crypto'

export const hash = (object) => {
  const string = JSON.stringify(object)
  const hash = createHash('sha1')
  hash.update(string)
  return hash.digest('hex')
}
