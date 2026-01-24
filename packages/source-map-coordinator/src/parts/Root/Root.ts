import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname: string = dirname(fileURLToPath(import.meta.url))

export const root: string = join(__dirname, '..', '..', '..', '..', '..')
