// based on chrome devtools HeapSnapshotLoader.ts (https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/entrypoints/heap_snapshot_worker/HeapSnapshotLoader.ts), BSD-3-Clause license
import { createReadStream } from 'node:fs'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { getNamedFunctionCountFromHeapSnapshot2 } from '../GetNamedFunctionCountFromHeapSnapshot2/GetNamedFunctionCountFromHeapSnapshot2.js'

/**
 * @param {string} path
 * @returns {Promise<void>}
 */
export const loadHeapSnapshot2 = async (path) => {
  const read = createReadStream(path)

  const { metaData, nodes, edges, locations } = await prepareHeapSnapshot(read)

  const uniqueFunctionLocations = getNamedFunctionCountFromHeapSnapshot2(locations)
  console.log({ locations: locations.length, ulocations: uniqueFunctionLocations.length / 5 })

  // for (const node of edges) {
  //   if (node > 2 ** 16 - 1) {
  //     console.log('is large', node)
  //   }
  // }
  // console.log({ metaData, nodes, edges })

  // TODO create lightweight facade around nodes and edges,
  // making traversing nodes and edges fast and efficient
  // similar to chrome devtools
}
