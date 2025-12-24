import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getCryptographyWorkerUrl = (): string => {
  const url = join(Root.root, 'packages/cryptography-worker/bin/cryptography-worker.js')
  return url
}
