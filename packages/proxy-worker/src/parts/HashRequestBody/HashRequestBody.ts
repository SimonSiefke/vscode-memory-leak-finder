import { createHash } from 'node:crypto'

export const hashRequestBody = (body: Buffer): string => {
  return createHash('sha256').update(body).digest('hex').slice(0, 16)
}
