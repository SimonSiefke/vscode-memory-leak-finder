const parseArgvNumber = (argv, name) => {
  const index = argv.indexOf(name)
  const next = index + 1
  const value = argv[next]
  const parsed = parseInt(value)
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
  if (argv.includes('--measureAfter')) {
    options.measureAfter = true
  }
  return options
}
