import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getCompressionWorkerUrl = (): string => {
  const url = join(Root.root, 'packages/compression-worker/bin/compression-worker.js')
  return url
}
