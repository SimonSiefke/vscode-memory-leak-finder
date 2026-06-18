import type { Dynamic } from '../Types/Types.ts'
import { existsSync } from 'node:fs'
export const exists = (path: Dynamic) => {
  return existsSync(path)
}
