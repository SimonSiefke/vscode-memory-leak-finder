import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const heapSnapshotWorkerPath = join(Root.root, 'packages', 'heap-snapshot-worker', 'src', 'main.ts')
