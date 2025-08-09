import * as TestRunMode from '../TestRunMode/TestRunMode.ts'
import * as Ide from '../Ide/Ide.ts'

const parseArgvNumber = (argv, name) => {
  const index = argv.indexOf(name)
  const next = index + 1
  const value = argv[next]
  const parsed = Number.parseInt(value)
  if (!isNaN(parsed) && isFinite(parsed)) {
    return parsed
  }
  return 1
}

const parseArgvString = (argv, name) => {
  const index = argv.indexOf(name)
  const next = index + 1
  const value = argv[next]
  if (typeof value === 'string') {
    return value
  }
  return ''
}

export const parseArgv = (argv) => {
  const options = {
    watch: false,
    headless: false,
    checkLeaks: false,
    runs: 1,
    color: true,
    recordVideo: false,
    cwd: process.cwd(),
    filter: '',
    measure: 'event-listener-count',
    measureAfter: false,
    timeouts: true,
    timeoutBetween: 0,
    restartBetween: false,
    runMode: TestRunMode.Auto,
    ide: Ide.VsCode,
    ideVersion: '', // TODO
    vscodePath: '',
    commit: '',
    setupOnly: false,
    workers: false,
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
  if (argv.includes('--vscode-path')) {
    options.vscodePath = parseArgvString(argv, '--vscode-path')
  }
  if (argv.includes('--commit')) {
    options.commit = parseArgvString(argv, '--commit')
  }
  if (argv.includes('--setup-only')) {
    options.setupOnly = true
  }
  if (argv.includes('--workers')) {
    options.workers = true
  }
  return options
}
