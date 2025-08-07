import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const parseHeapSnapshotStringsCount = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {})
  const { strings } = snapshot
  return strings.length
}
