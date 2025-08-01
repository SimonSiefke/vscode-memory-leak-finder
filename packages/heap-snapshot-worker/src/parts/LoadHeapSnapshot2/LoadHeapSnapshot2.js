// based on chrome devtools HeapSnapshotLoader.ts (https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/entrypoints/heap_snapshot_worker/HeapSnapshotLoader.ts), BSD-3-Clause license
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

/**
 * @param {string} path
 * @returns {Promise<void>}
 */
export const loadHeapSnapshot2 = async (path) => {
  const { metaData, nodes, edges, locations } = await prepareHeapSnapshot(path)

  console.log({ locations: locations.length })

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
