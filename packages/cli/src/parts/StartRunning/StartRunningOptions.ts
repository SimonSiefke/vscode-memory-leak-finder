export interface StartRunningOptions {
  filterValue: string
  headlessMode: boolean
  color: boolean
  checkLeaks: boolean
  runSkippedTestsAnyway: boolean
  recordVideo: boolean
  cwd: string
  runs: number
  measure: string
  measureAfter: boolean
  measureNode: boolean
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
  shouldContinue: boolean
  inspectSharedProcess: boolean
  inspectExtensions: boolean
  inspectPtyHost: boolean
}
