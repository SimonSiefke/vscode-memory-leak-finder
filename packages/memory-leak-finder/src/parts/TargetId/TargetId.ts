export const Browser = 1
export const Node = 2
export const Worker = 3

export type Target = typeof Browser | typeof Node | typeof Worker
export type TargetsArray = readonly Target[]
