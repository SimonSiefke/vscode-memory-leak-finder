import { createHash } from 'node:crypto'

export const hashUrl = (url: string): string => {
  const hash = createHash('sha1')
  hash.update(url)
  return hash.digest('hex')
}
