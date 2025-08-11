import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getInitializationWorkerUrl = () => {
  const url = join(Root.root, 'packages/initialization-worker/bin/initialization-worker.ts')
  return url
}
