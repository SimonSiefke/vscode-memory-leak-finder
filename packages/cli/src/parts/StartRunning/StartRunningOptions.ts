export interface StartRunningOptions {
  filterValue: string
  headlessMode: boolean
  color: boolean
  checkLeaks: boolean
  recordVideo: boolean
  cwd: string
  runs: number
  measure: string
  measureAfter: boolean
  timeouts: boolean
  timeoutBetween: number
  restartBetween: boolean
  runMode: number
  ide: string
  ideVersion: string
  vscodePath: string
  commit: string
  setupOnly: boolean
  workers: boolean
  isWindows: boolean
}
