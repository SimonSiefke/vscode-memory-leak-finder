/**
 * @param {import('../Snapshot/Snapshot.js').Snapshot} snapshot
 * @returns {readonly string[]}
 */
export const getStringsInternal = (snapshot) => {
  return snapshot.strings
}
