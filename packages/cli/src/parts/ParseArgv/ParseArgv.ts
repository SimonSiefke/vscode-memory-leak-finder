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

interface ParsedVscodeVersion {
  readonly insidersCommit: string
  readonly vscodeVersion: string
}

const parseVscodeVersion = (defaultVersionValue: string, argv: readonly string[]): ParsedVscodeVersion => {
  if (argv.includes('--vscode-version')) {
    const vscodeVersionValue = parseArgvString(argv, '--vscode-version')
    if (vscodeVersionValue.startsWith('insiders:')) {
      const commitHash = vscodeVersionValue.slice('insiders:'.length)
      return {
        vscodeVersion: '',
        insidersCommit: commitHash,
      }
    }
    return {
      vscodeVersion: vscodeVersionValue,
      insidersCommit: '',
    }
  }
  if (defaultVersionValue.startsWith('insiders:')) {
    const commitHash = defaultVersionValue.slice('insiders:'.length)
    return {
      vscodeVersion: '',
      insidersCommit: commitHash,
    }
  }
  return {
    insidersCommit: '',
    vscodeVersion: defaultVersionValue,
<<<<<<< HEAD
  }
}

export const parseArgv = (argv: readonly string[]) => {
  const parsedVersion = parseVscodeVersion(VsCodeVersion.vscodeVersion, argv)
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
    insidersCommit: parsedVersion.insidersCommit,
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
    vscodeVersion: parsedVersion.vscodeVersion,
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
=======
>>>>>>> origin/main
  }
}

const parseWatch = (argv: readonly string[]): boolean => {
  return argv.includes('--watch')
}

const parseHeadless = (argv: readonly string[]): boolean => {
  return argv.includes('--headless')
}

const parseCheckLeaks = (argv: readonly string[]): boolean => {
  return argv.includes('--check-leaks')
}

const parseRunSkippedTestsAnyway = (argv: readonly string[]): boolean => {
  return argv.includes('--run-skipped-tests-anyway')
}

const parseRecordVideo = (argv: readonly string[]): boolean => {
  return argv.includes('--record-video')
}

const parseRuns = (argv: readonly string[]): number => {
  if (argv.includes('--runs')) {
    return parseArgvNumber(argv, '--runs')
  }
  return 1
}

const parseCwd = (argv: readonly string[]): string => {
  if (argv.includes('--cwd')) {
    return parseArgvString(argv, '--cwd')
  }
  return process.cwd()
}

const parseMeasure = (argv: readonly string[]): string => {
  if (argv.includes('--measure')) {
    return parseArgvString(argv, '--measure')
  }
  return 'event-listener-count'
}

const parseFilter = (argv: readonly string[]): string => {
  if (argv.includes('--only')) {
    return parseArgvString(argv, '--only')
  }
  return ''
}

const parseMeasureAfter = (argv: readonly string[]): boolean => {
  return argv.includes('--measure-after')
}

const parseMeasureNode = (argv: readonly string[]): boolean => {
  return argv.includes('--measure-node')
}

const parseTimeouts = (argv: readonly string[]): boolean => {
  if (argv.includes('--disable-timeouts')) {
    return false
  }
  return true
}

const parseTimeoutBetween = (argv: readonly string[]): number => {
  if (argv.includes('--timeout-between')) {
    return parseArgvNumber(argv, '--timeout-between')
  }
  return 0
}

const parseRestartBetween = (argv: readonly string[]): boolean => {
  return argv.includes('--restart-between')
}

const parseRunMode = (argv: readonly string[]): number => {
  if (argv.includes('--run-mode=vm')) {
    return TestRunMode.Vm
  }
  if (argv.includes('--run-mode=import')) {
    return TestRunMode.Import
  }
  return TestRunMode.Auto
}

const parseIde = (argv: readonly string[]): string => {
  if (argv.includes('--ide=cursor')) {
    return Ide.Cursor
  }
  return Ide.VsCode
}

const parseVscodePath = (argv: readonly string[]): string => {
  if (argv.includes('--vscode-path')) {
    return parseArgvString(argv, '--vscode-path')
  }
  return ''
}

const parseCommit = (argv: readonly string[]): string => {
  if (argv.includes('--commit')) {
    return parseArgvString(argv, '--commit')
  }
  return ''
}

const parseInsidersCommit = (parsedVersion: ParsedVscodeVersion, argv: readonly string[]): string => {
  if (argv.includes('--insiders-commit')) {
    return parseArgvString(argv, '--insiders-commit')
  }
  return parsedVersion.insidersCommit
}

const parseSetupOnly = (argv: readonly string[]): boolean => {
  return argv.includes('--setup-only')
}

const parseWorkers = (argv: readonly string[]): boolean => {
  return argv.includes('--workers')
}

const parseContinueValue = (argv: readonly string[]): string => {
  if (argv.includes('--continue')) {
    return parseArgvString(argv, '--continue')
  }
  return ''
}

const parseInspectSharedProcess = (argv: readonly string[]): boolean => {
  return argv.includes('--inspect-shared-process')
}

const parseInspectExtensions = (argv: readonly string[]): boolean => {
  return argv.includes('--inspect-extensions')
}

const parseInspectPtyHost = (argv: readonly string[]): boolean => {
  return argv.includes('--inspect-ptyhost')
}

const parseEnableExtensions = (argv: readonly string[]): boolean => {
  return argv.includes('--enable-extensions')
}

const parseInspectPtyHostPort = (argv: readonly string[]): number => {
  if (argv.includes('--inspect-ptyhost-port')) {
    return parseArgvNumber(argv, '--inspect-ptyhost-port')
  }
  return 5877
}

const parseInspectSharedProcessPort = (argv: readonly string[]): number => {
  if (argv.includes('--inspect-shared-process-port')) {
    return parseArgvNumber(argv, '--inspect-shared-process-port')
  }
  return 5879
}

const parseInspectExtensionsPort = (argv: readonly string[]): number => {
  if (argv.includes('--inspect-extensions-port')) {
    return parseArgvNumber(argv, '--inspect-extensions-port')
  }
  return 5870
}

const parseEnableProxy = (argv: readonly string[]): boolean => {
  return argv.includes('--enable-proxy')
}

const parseUseProxyMock = (argv: readonly string[]): boolean => {
  return argv.includes('--use-proxy-mock')
}

const parseBisect = (argv: readonly string[]): boolean => {
  return argv.includes('--bisect')
}

const parseScreencastQuality = (argv: readonly string[]): number => {
  if (argv.includes('--screencast-quality')) {
    return parseArgvNumber(argv, '--screencast-quality')
  }
  return 90
}

const parseClearExtensions = (argv: readonly string[]): boolean => {
  return argv.includes('--clear-extensions')
}

export const parseArgv = (argv: readonly string[]) => {
  const parsedVersion = parseVscodeVersion(VsCodeVersion.vscodeVersion, argv)
  const bisect = parseBisect(argv)
  const checkLeaks = parseCheckLeaks(argv)
  const clearExtensions = parseClearExtensions(argv)
  const color = true
  const commit = parseCommit(argv)
  const continueValue = parseContinueValue(argv)
  const cwd = parseCwd(argv)
  const enableExtensions = parseEnableExtensions(argv)
  const enableProxy = parseEnableProxy(argv)
  const filter = parseFilter(argv)
  const headless = parseHeadless(argv)
  const ide = parseIde(argv)
  const ideVersion = ''
  const insidersCommit = parseInsidersCommit(parsedVersion, argv)
  const inspectExtensions = parseInspectExtensions(argv)
  const inspectExtensionsPort = parseInspectExtensionsPort(argv)
  const inspectPtyHost = parseInspectPtyHost(argv)
  const inspectPtyHostPort = parseInspectPtyHostPort(argv)
  const inspectSharedProcess = parseInspectSharedProcess(argv)
  const inspectSharedProcessPort = parseInspectSharedProcessPort(argv)
  const measure = parseMeasure(argv)
  const measureAfter = parseMeasureAfter(argv)
  const measureNode = parseMeasureNode(argv)
  const recordVideo = parseRecordVideo(argv)
  const restartBetween = parseRestartBetween(argv)
  const runMode = parseRunMode(argv)
  const runs = parseRuns(argv)
  const runSkippedTestsAnyway = parseRunSkippedTestsAnyway(argv)
  const screencastQuality = parseScreencastQuality(argv)
  const setupOnly = parseSetupOnly(argv)
  const timeoutBetween = parseTimeoutBetween(argv)
  const timeouts = parseTimeouts(argv)
  const useProxyMock = parseUseProxyMock(argv)
  const vscodePath = parseVscodePath(argv)
  const vscodeVersion = parsedVersion.vscodeVersion
  const watch = parseWatch(argv)
  const workers = parseWorkers(argv)
  const isWindows = IsWindows.isWindows(process.platform)
  return {
    bisect,
    checkLeaks,
    clearExtensions,
    color,
    commit,
    continueValue,
    cwd,
    enableExtensions,
    enableProxy,
    filter,
    headless,
    ide,
    ideVersion,
    insidersCommit,
    inspectExtensions,
    inspectExtensionsPort,
    inspectPtyHost,
    inspectPtyHostPort,
    inspectSharedProcess,
    inspectSharedProcessPort,
    measure,
    measureAfter,
    measureNode,
    recordVideo,
    restartBetween,
    runMode,
    runs,
    runSkippedTestsAnyway,
    screencastQuality,
    setupOnly,
    timeoutBetween,
    timeouts,
    useProxyMock,
    vscodePath,
    vscodeVersion,
    watch,
    workers,
    isWindows,
  }
<<<<<<< HEAD
  if (argv.includes('--ide=cursor')) {
    options.ide = Ide.Cursor
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
=======
>>>>>>> origin/main
}
