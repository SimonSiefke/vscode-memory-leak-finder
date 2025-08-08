import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

/**
 * @param {string} path
 * @returns {Promise<string[]>}
 */
export const getStrings = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })

  return snapshot.strings
}
