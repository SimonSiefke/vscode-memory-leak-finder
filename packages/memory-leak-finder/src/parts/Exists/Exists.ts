import { existsSync } from 'node:fs'

export const exists = (path: string): boolean => {
  return existsSync(path)
}
