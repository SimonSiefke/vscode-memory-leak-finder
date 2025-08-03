import * as PrepareHeapSnapshot from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const commandMap = {
  'HeapSnapshot.parse': PrepareHeapSnapshot.prepareHeapSnapshot,
}
