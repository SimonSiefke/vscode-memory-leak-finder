import type { Snapshot } from '../Snapshot/Snapshot.ts'

/**
 * @param {Snapshot} snapshot
 * @returns {readonly string[]}
 */
export const getStringsInternal = (snapshot: Snapshot): readonly string[] => {
  return snapshot.strings
}
