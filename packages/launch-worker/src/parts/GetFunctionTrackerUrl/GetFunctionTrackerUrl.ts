import { join } from 'node:path'

export const getFunctionTrackerUrl = (): string => {
  const root = join(import.meta.dirname, '..', '..', '..', '..', '..')
  return join(root, 'packages', 'function-tracker', 'src', 'main.ts')
}
