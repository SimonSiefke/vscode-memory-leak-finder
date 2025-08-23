import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const memoryLeakWorkerUrl = join(Root.root, 'packages/memory-leak-finder/bin/memory-leak-worker.ts')
