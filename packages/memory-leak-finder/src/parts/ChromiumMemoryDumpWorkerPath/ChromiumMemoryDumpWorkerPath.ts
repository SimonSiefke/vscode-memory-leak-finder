import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const chromiumMemoryDumpWorkerPath = join(Root.root, 'packages', 'chromium-memory-dump-worker', 'src', 'main.ts')
