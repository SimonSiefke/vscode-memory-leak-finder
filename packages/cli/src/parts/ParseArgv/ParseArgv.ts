import * as Ide from '../Ide/Ide.ts'
import * as IsWindows from '../IsWindows/IsWindows.ts'
import * as TestRunMode from '../TestRunMode/TestRunMode.ts'
import * as VsCodeVersion from '../VsCodeVersion/VsCodeVersion.ts'

const parseArgvNumber = (argv: readonly string[], name: string): number => {
  const index = argv.indexOf(name)
  const next = index + 1
  const value = argv[next]
  const parsed = Number.parseInt(value)
  if (!isNaN(parsed) && isFinite(parsed)) {
    return parsed
  }
  return 1
}

const parseArgvString = (argv: readonly string[], name: string): string => {
  const index = argv.indexOf(name)
  const next = index + 1
  const value = argv[next]
  if (typeof value === 'string') {
    return value
  }
  return ''
}

export const parseArgv = (argv: readonly string[]) => {
  const options = {
    bisect: false,
    checkLeaks: false,
    clearExtensions: false,
    color: true,
    commit: '',
    continueValue: '',
    cwd: process.cwd(),
    enableExtensions: false,
    enableProxy: false,
    filter: '',
    headless: false,
    ide: Ide.VsCode,
    ideVersion: '', // TODO
    insidersCommit: '',
    inspectExtensions: false,
    inspectExtensionsPort: 5870,
    inspectPtyHost: false,
    inspectPtyHostPort: 5877,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 5879,
    measure: 'event-listener-count',
    measureAfter: false,
    measureNode: false,
    recordVideo: false,
    restartBetween: false,
    runMode: TestRunMode.Auto,
    runs: 1,
    runSkippedTestsAnyway: false,
    screencastQuality: 90,
    setupOnly: false,
    timeoutBetween: 0,
    timeouts: true,
    useProxyMock: false,
    vscodePath: '',
    vscodeVersion: VsCodeVersion.vscodeVersion,
    watch: false,
    workers: false,
    isWindows: IsWindows.isWindows(process.platform),
  }
  if (argv.includes('--watch')) {
    options.watch = true
  }
  if (argv.includes('--headless')) {
    options.headless = true
  }
  if (argv.includes('--check-leaks')) {
    options.checkLeaks = true
  }
  if (argv.includes('--run-skipped-tests-anyway')) {
    options.runSkippedTestsAnyway = true
  }
  if (argv.includes('--record-video')) {
    options.recordVideo = true
  }
  if (argv.includes('--runs')) {
    options.runs = parseArgvNumber(argv, '--runs')
  }
  if (argv.includes('--cwd')) {
    options.cwd = parseArgvString(argv, '--cwd')
  }
  if (argv.includes('--measure')) {
    options.measure = parseArgvString(argv, '--measure')
  }
  if (argv.includes('--only')) {
    options.filter = parseArgvString(argv, '--only')
  }
  if (argv.includes('--measure-after')) {
    options.measureAfter = true
  }
  if (argv.includes('--measure-node')) {
    options.measureNode = true
  }
  if (argv.includes('--disable-timeouts')) {
    options.timeouts = false
  }
  if (argv.includes('--timeout-between')) {
    options.timeoutBetween = parseArgvNumber(argv, '--timeout-between')
  }
  if (argv.includes('--restart-between')) {
    options.restartBetween = true
  }
  if (argv.includes('--run-mode=vm')) {
    options.runMode = TestRunMode.Vm
  }
  if (argv.includes('--run-mode=import')) {
    options.runMode = TestRunMode.Import
  }
  if (argv.includes('--ide=cursor')) {
    options.ide = Ide.Cursor
  }
  if (argv.includes('--vscode-version')) {
    options.vscodeVersion = parseArgvString(argv, '--vscode-version')
  }
  if (argv.includes('--vscode-path')) {
    options.vscodePath = parseArgvString(argv, '--vscode-path')
  }
  if (argv.includes('--commit')) {
    options.commit = parseArgvString(argv, '--commit')
  }
  if (argv.includes('--insiders-commit')) {
    options.insidersCommit = parseArgvString(argv, '--insiders-commit')
  }
  if (argv.includes('--setup-only')) {
    options.setupOnly = true
  }
  if (argv.includes('--workers')) {
    options.workers = true
  }
  if (argv.includes('--continue')) {
    options.continueValue = parseArgvString(argv, '--continue')
  }
  if (argv.includes('--inspect-shared-process')) {
    options.inspectSharedProcess = true
  }
  if (argv.includes('--inspect-extensions')) {
    options.inspectExtensions = true
  }
  if (argv.includes('--inspect-ptyhost')) {
    options.inspectPtyHost = true
  }
  if (argv.includes('--enable-extensions')) {
    options.enableExtensions = true
  }
  if (argv.includes('--inspect-ptyhost-port')) {
    options.inspectPtyHostPort = parseArgvNumber(argv, '--inspect-ptyhost-port')
  }
  if (argv.includes('--inspect-shared-process-port')) {
    options.inspectSharedProcessPort = parseArgvNumber(argv, '--inspect-shared-process-port')
  }
  if (argv.includes('--inspect-extensions-port')) {
    options.inspectExtensionsPort = parseArgvNumber(argv, '--inspect-extensions-port')
  }
  if (argv.includes('--enable-proxy')) {
    options.enableProxy = true
  }
  if (argv.includes('--use-proxy-mock')) {
    options.useProxyMock = true
  }
  if (argv.includes('--bisect')) {
    options.bisect = true
  }
  if (argv.includes('--screencast-quality')) {
    options.screencastQuality = parseArgvNumber(argv, '--screencast-quality')
  }
  if (argv.includes('--clear-extensions')) {
    options.clearExtensions = true
  }
  return options
}
