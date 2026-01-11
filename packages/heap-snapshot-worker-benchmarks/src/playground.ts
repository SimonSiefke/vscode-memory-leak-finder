import { join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const main = async (): Promise<void> => {
  const { loadHeapSnapshot2 } = await importHeapSnapshotWorker('parts/LoadHeapSnapshot2/LoadHeapSnapshot2.ts')
  const path = join(import.meta.dirname, '../../../.vscode-heapsnapshots', '1.json')
  console.log(process.memoryUsage())
  console.time('load')
  await loadHeapSnapshot2(path)
  console.timeEnd('load')
  console.log(process.memoryUsage())

  // console.time('load2')
  // await load2(path)
  // console.timeEnd('load2')
}

main()
