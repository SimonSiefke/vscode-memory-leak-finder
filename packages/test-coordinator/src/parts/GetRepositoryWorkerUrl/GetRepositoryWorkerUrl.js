import { join } from 'node:path'
import * as Root from '../Root/Root.js'

export const getRepositoryWorkerUrl = () => {
  const url = join(Root.root, 'packages/repository-worker/bin/repository-worker.js')
  return url
} 