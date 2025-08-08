import { getStringsInternal } from '../GetStringsInternal/GetStringsInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

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
