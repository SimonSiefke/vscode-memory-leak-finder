import { randomUUID } from 'node:crypto'

export const create = () => {
  return `og:${randomUUID()}`
}
