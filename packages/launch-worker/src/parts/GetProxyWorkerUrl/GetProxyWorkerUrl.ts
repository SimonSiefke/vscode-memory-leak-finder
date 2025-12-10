import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getProxyWorkerUrl = (): string => {
  const url = join(Root.root, 'packages/proxy-worker/bin/proxy-worker.js')
  return url
}

