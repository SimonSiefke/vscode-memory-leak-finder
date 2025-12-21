import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getRepositoryWorkerUrl = (): string => {
  const url = join(Root.root, 'packages/repository-worker/bin/repository-worker.js')
  return url
}
