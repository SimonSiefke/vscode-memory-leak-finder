import { existsSync } from 'node:fs'

export const exists = (path) => {
  return existsSync(path)
}
