import { join } from 'node:path'

const __dirname = import.meta.dirname

export const getFunctionTrackerUrl = (): string => {
  const root = join(__dirname, '..', '..', '..', '..', '..')
  const url = join(root, 'packages', 'function-tracker', 'src', 'main.ts')
  return url
}
