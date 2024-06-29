import { join } from 'node:path'
import * as Root from '../Root/Root.js'

export const heapSnapshotWorkerPath = join(Root.root, 'packages', 'heap-snapshot-worker', 'src', 'main.js')
