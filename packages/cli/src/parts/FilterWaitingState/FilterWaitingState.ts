export interface FilterWaitingState {
  value: string
  mode: number
  stdout: string[]
  // Allow additional properties carried through state
  [key: string]: any
}
