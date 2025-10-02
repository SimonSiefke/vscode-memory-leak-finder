import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getLaunchWorkerUrl = () => {
  const url = join(Root.root, 'packages/launch-worker/bin/launch-worker.js')
  return url
}
