export interface RunTestsOptions {
  readonly bisect?: boolean
  readonly checkLeaks: boolean
  readonly color: boolean
  readonly commit: string
  readonly continueValue: string
  readonly cwd: string
  readonly enableExtensions: boolean
  readonly enableProxy: boolean
  readonly filterValue: string
  readonly headlessMode: boolean
  readonly ide: any
  readonly ideVersion: any
  readonly insidersCommit: string
  readonly inspectExtensions: boolean
  readonly inspectExtensionsPort: number
  readonly inspectPtyHost: boolean
  readonly inspectPtyHostPort: number
  readonly inspectSharedProcess: boolean
  readonly inspectSharedProcessPort: number
  readonly measure: string
  readonly measureAfter: boolean
  readonly measureNode: boolean
  readonly recordVideo: boolean
  readonly restartBetween: boolean
  readonly root: string
  readonly runMode: number
  readonly runs: number
  readonly runSkippedTestsAnyway: boolean
  readonly setupOnly: boolean
  readonly timeoutBetween: number
  readonly timeouts: any
  readonly useProxyMock: boolean
  readonly vscodePath: string
  readonly vscodeVersion: string
}

export interface RunTestsWithCallbackOptions extends RunTestsOptions {
  readonly addDisposable: (fn: () => Promise<void>) => void
  readonly callback: (...param: readonly any[]) => Promise<void>
  readonly clearDisposables: () => Promise<void>
}
