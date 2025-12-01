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
  readonly runMode: number
  readonly ide: any
  readonly ideVersion: any
  readonly vscodePath: string
  readonly commit: string
  readonly setupOnly: boolean
  readonly inspectSharedProcess: boolean
  readonly inspectExtensions: boolean
  readonly inspectPtyHost: boolean
  readonly enableExtensions: boolean
}

export interface RunTestsWithCallbackOptions extends RunTestsOptions {
  readonly callback: (...param: readonly any[]) => Promise<void>
  readonly addDisposable: (fn: () => Promise<void>) => void
  readonly clearDisposables: () => Promise<void>
}
