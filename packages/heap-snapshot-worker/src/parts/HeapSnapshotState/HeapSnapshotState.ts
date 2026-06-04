import type { Snapshot } from '../Snapshot/Snapshot.ts'

const snapshots: Record<number, Snapshot> = Object.create(null)

export const set = (id: number, value: Snapshot): void => {
  snapshots[id] = value
}

export const get = (id: number): Snapshot | undefined => {
  const value = snapshots[id]
  delete snapshots[id]
  return value
}

export const dispose = (id: number): void => {
  delete snapshots[id]
}
