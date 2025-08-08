import { join } from 'path'
import { loadHeapSnapshot2 } from '../src/parts/LoadHeapSnapshot2/LoadHeapSnapshot2.js'

const main = async () => {
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
