import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getStringsInternal = (snapshot: Snapshot): readonly string[] => {
  return snapshot.strings
}
