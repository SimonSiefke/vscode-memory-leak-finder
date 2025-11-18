import type { StdinDataState } from '../StdinDataState/StdinDataState.ts'
import * as Ide from '../Ide/Ide.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as TestRunMode from '../TestRunMode/TestRunMode.ts'

export const createDefaultState = (): StdinDataState => ({
  buffering: false,
  checkLeaks: false,
  runSkippedTestsAnyway: false,
  cwd: '',
  filter: '',
  headless: false,
  isGithubActions: false,
  measure: '',
  mode: ModeType.Waiting,
  recordVideo: false,
  runs: 1,
  value: '',
  watch: false,
  measureAfter: false,
  timeouts: true,
  timeoutBetween: 0,
  restartBetween: false,
  runMode: TestRunMode.Auto,
  ide: Ide.VsCode,
  ideVersion: Ide.VsCode,
  workers: false,
  stdout: [],
  isWindows: false,
  previousFilters: [],
  exitCode: 0,
  shouldContinue: false,
  inspectExtensions: false,
  inspectPtyHost: false,
  inspectSharedProcess: false,
  measureNode: false,
  enableExtensions: false,
})
