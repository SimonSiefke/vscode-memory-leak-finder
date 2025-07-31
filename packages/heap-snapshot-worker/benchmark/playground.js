import { join } from 'path'
import { loadHeapSnapshot2 } from '../src/parts/LoadHeapSnapshot2/LoadHeapSnapshot2.js'

const main = async () => {
  const path = join(import.meta.dirname, '../../../.vscode-heapsnapshots', '1.json')
  console.time('load')
  console.log(process.memoryUsage())
  await loadHeapSnapshot2(path)
  console.log(process.memoryUsage())
  console.timeEnd('load')
}

main()
