import { join } from 'node:path'
import * as Root from '../Root/Root.js'

export const memoryLeakWorkerUrl = join(Root.root, 'packages/memory-leak-worker/bin/memory-leak-worker.js')
