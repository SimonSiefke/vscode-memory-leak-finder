import type { HeapSnapshotInput, Snapshot } from '../Snapshot/Snapshot.ts'

const snapshots: Record<string, Snapshot | HeapSnapshotInput | unknown> = Object.create(null)

export const set = (id: string | number, value: unknown): void => {
  snapshots[id] = value
}

export const get = <T = Snapshot>(id: string | number): T => {
  const value = snapshots[id]
  delete snapshots[id]
  return value as T
}

export const dispose = (id: string | number): void => {
  delete snapshots[id]
}
