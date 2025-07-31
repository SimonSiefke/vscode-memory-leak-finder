import { join } from 'path'
import { commandMap } from './parts/CommandMap/CommandMap.js'
import { loadHeapSnapshot2 } from './parts/LoadHeapSnapshot2/LoadHeapSnapshot2.js'

const path = join(import.meta.dirname, '../../../.vscode-heapsnapshots', '1.json')

const main = async () => {
  console.time('load')
  console.log(process.memoryUsage())
  await loadHeapSnapshot2(path)
  console.log(process.memoryUsage())
  console.timeEnd('load')
}

main()
