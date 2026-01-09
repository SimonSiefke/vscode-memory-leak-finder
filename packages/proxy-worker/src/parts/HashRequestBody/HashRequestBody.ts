import { createHash } from 'node:crypto'
import * as NormalizeRequestBody from '../NormalizeRequestBody/NormalizeRequestBody.ts'

export const hashRequestBody = (body: Buffer): string => {
  const normalizedBody = NormalizeRequestBody.normalizeRequestBody(body)
  return createHash('sha256').update(normalizedBody).digest('hex').slice(0, 16)
}
