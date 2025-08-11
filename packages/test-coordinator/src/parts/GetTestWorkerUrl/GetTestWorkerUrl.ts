import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getTestWorkerUrl = () => {
  const url = join(Root.root, 'packages/test-worker/bin/test-worker.ts')
  return url
}
