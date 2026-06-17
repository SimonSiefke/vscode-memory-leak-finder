import type { Snapshot } from '../Snapshot/Snapshot.ts'

const snapshots: Record<string, Snapshot> = Object.create(null)

export const set = (id: string, value: Snapshot): void => {
  snapshots[id] = value
}

export const get = (id: string): Snapshot => {
  const value = snapshots[id]
  delete snapshots[id]
  return value
}

export const dispose = (id: string): void => {
  delete snapshots[id]
}
