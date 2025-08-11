import { getStringsInternal } from '../GetStringsInternal/GetStringsInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

/**
 * @param {string} path
 * @returns {Promise<readonly string[]>}
 */
export const getStrings = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getStringsInternal(snapshot)
}
