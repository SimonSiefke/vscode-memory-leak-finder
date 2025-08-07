import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const parseHeapSnapshotStringsCount = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  console.log({ snapshot })
  const { strings } = snapshot
  return strings.length
}
