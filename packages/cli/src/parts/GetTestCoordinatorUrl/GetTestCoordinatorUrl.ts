import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getTestCoordinatorUrl = (): string => {
  const url = join(Root.root, 'packages/test-coordinator/bin/test-coordinator.ts')
  return url
}
