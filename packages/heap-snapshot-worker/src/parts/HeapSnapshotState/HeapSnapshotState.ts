import type { Snapshot } from '../Snapshot/Snapshot.ts'

const snapshots: Record<string, Snapshot> = Object.create(null)

export const set = (id: string | number, value: unknown): void => {
  snapshots[id] = value as Snapshot
}

export const get = (id: string | number): Snapshot => {
  const value = snapshots[id]
  delete snapshots[id]
  return value
}

export const dispose = (id: string | number): void => {
  delete snapshots[id]
}
