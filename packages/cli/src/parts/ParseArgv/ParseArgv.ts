import { join } from 'node:path'
import * as Ide from '../Ide/Ide.ts'
import * as IsWindows from '../IsWindows/IsWindows.ts'
import { root } from '../Root/Root.ts'
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
        insidersCommit: commitHash,
        vscodeVersion: '',
      }
    }
    return {
      insidersCommit: '',
      vscodeVersion: vscodeVersionValue,
    }
  }
  if (defaultVersionValue.startsWith('insiders:')) {
    const commitHash = defaultVersionValue.slice('insiders:'.length)
    return {
      insidersCommit: commitHash,
      vscodeVersion: '',
    }
  }
  return {
    insidersCommit: '',
    vscodeVersion: defaultVersionValue,
  }
}

const parseWatch = (argv: readonly string[]): boolean => {
  return argv.includes('--watch')
}

const parseHeadless = (argv: readonly string[]): boolean => {
  return argv.includes('--headless')
}

const parseCheckLeaks = (argv: readonly string[]): boolean => {
  if (argv.includes('--check-leaks')) {
    return true
  }
  if (argv.includes('--measure')) {
    return true
  }
  return false
}

const parseRunSkippedTestsAnyway = (argv: readonly string[]): boolean => {
  return argv.includes('--run-skipped-tests-anyway')
}

const parseRecordVideo = (argv: readonly string[]): boolean => {
  return argv.includes('--record-video')
}

const parseCompressVideo = (argv: readonly string[]): boolean => {
  return argv.includes('--compress-video')
}

const parseRuns = (argv: readonly string[]): number => {
  if (argv.includes('--runs')) {
    return parseArgvNumber(argv, '--runs')
  }
  return 1
}

const parseCwd = (cwd: string, argv: readonly string[]): string => {
  if (argv.includes('--cwd')) {
    return parseArgvString(argv, '--cwd')
  }
  return join(root, 'packages/e2e')
}

const parseMeasure = (argv: readonly string[]): string => {
  if (argv.includes('--measure')) {
    return parseArgvString(argv, '--measure')
  }
  return 'event-listener-count'
}

const parseFilter = (argv: readonly string[]): string => {
  if (argv.includes('--only')) {
    const filterValue = parseArgvString(argv, '--only')
    if (filterValue.endsWith('.ts')) {
      return filterValue
    }
    // Replace dots with dashes for backwards compatibility
    return filterValue.replaceAll('.', '-')
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

const parseLogin = (argv: readonly string[]): boolean => {
  return argv.includes('--login')
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
  return 95
}

const parseClearExtensions = (argv: readonly string[]): boolean => {
  return argv.includes('--clear-extensions')
}

const parseUpdateUrl = (argv: readonly string[]): string => {
  if (argv.includes('--update-url')) {
    return parseArgvString(argv, '--update-url')
  }
  return 'https://update.code.visualstudio.com'
}

const parsePlatform = (platform: string, argv: readonly string[]): string => {
  if (argv.includes('--platform')) {
    return parseArgvString(argv, '--platform')
  }
  return platform
}

const parsePageObjectPath = (argv: readonly string[]): string => {
  if (argv.includes('--page-object-path')) {
    return parseArgvString(argv, '--page-object-path')
  }
  return ''
}

const parseTrackFunctions = (argv: readonly string[]): boolean => {
  return argv.includes('--track-functions') || parseMeasure(argv) === 'tracked-functions'
}

const parseOpenDevtools = (argv: readonly string[]): boolean => {
  return argv.includes('--open-devtools')
}

const parseResolveExtensionSourceMaps = (argv: readonly string[]): boolean => {
  return argv.includes('--resolve-extension-source-maps')
}

export const parseArgv = (processPlatform: string, arch: string, argv: readonly string[]) => {
  const platform = parsePlatform(processPlatform, argv)
  const pageObjectPath = parsePageObjectPath(argv)
  const parsedVersion = parseVscodeVersion(VsCodeVersion.vscodeVersion, argv)
  const bisect = parseBisect(argv)
  const checkLeaks = parseCheckLeaks(argv)
  const clearExtensions = parseClearExtensions(argv)
  const color = true
  const commit = parseCommit(argv)
  const continueValue = parseContinueValue(argv)
  const cwd = parseCwd(process.cwd(), argv)
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
  const compressVideo = parseCompressVideo(argv)
  const restartBetween = parseRestartBetween(argv)
  const runMode = parseRunMode(argv)
  const runs = parseRuns(argv)
  const runSkippedTestsAnyway = parseRunSkippedTestsAnyway(argv)
  const screencastQuality = parseScreencastQuality(argv)
  const setupOnly = parseSetupOnly(argv)
  const login = parseLogin(argv)
  const timeoutBetween = parseTimeoutBetween(argv)
  const timeouts = parseTimeouts(argv)
  const trackFunctions = parseTrackFunctions(argv)
  const openDevtools = parseOpenDevtools(argv)
  const resolveExtensionSourceMaps = parseResolveExtensionSourceMaps(argv)
  const useProxyMock = parseUseProxyMock(argv)
  const updateUrl = parseUpdateUrl(argv)
  const vscodePath = parseVscodePath(argv)
  const { vscodeVersion } = parsedVersion
  const watch = parseWatch(argv)
  const workers = parseWorkers(argv)
  const isWindows = IsWindows.isWindows(processPlatform)
  return {
    arch,
    bisect,
    checkLeaks,
    clearExtensions,
    color,
    commit,
    compressVideo,
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
    isWindows,
    login,
    measure,
    measureAfter,
    measureNode,
    openDevtools,
    pageObjectPath,
    platform,
    recordVideo,
    resolveExtensionSourceMaps,
    restartBetween,
    runMode,
    runs,
    runSkippedTestsAnyway,
    screencastQuality,
    setupOnly,
    timeoutBetween,
    timeouts,
    trackFunctions,
    updateUrl,
    useProxyMock,
    vscodePath,
    vscodeVersion,
    watch,
    workers,
  }
}
