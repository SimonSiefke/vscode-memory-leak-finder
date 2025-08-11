/**
 * @param {import('../Snapshot/Snapshot.ts').Snapshot} snapshot
 * @returns {readonly string[]}
 */
export const getStringsInternal = (snapshot) => {
  return snapshot.strings
}
