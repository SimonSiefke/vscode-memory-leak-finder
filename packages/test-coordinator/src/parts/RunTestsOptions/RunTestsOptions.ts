export interface RunTestsOptions {
  readonly root: string
  readonly cwd: string
  readonly filterValue: string
  readonly headlessMode: boolean
  readonly color: boolean
  readonly checkLeaks: boolean
  readonly runSkippedTestsAnyway: boolean
  readonly recordVideo: boolean
  readonly runs: number
  readonly measure: string
  readonly measureAfter: boolean
  readonly measureNode: boolean
  readonly timeouts: any
  readonly timeoutBetween: number
  readonly restartBetween: boolean
  readonly runMode: string
  readonly ide: any
  readonly ideVersion: any
  readonly vscodePath: string
  readonly commit: string
  readonly setupOnly: boolean
  readonly shouldContinue: boolean
}

export interface RunTestsWithCallbackOptions extends RunTestsOptions {
  readonly callback: (...param: readonly any[]) => Promise<void>
}
