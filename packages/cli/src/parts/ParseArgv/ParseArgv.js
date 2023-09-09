export const parseArgv = (argv) => {
  const options = {
    watch: false,
    headless: false,
    checkLeaks: false,
    runs: 1,
    color: true,
    recordVideo: false,
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
    const index = argv.indexOf('--runs')
    const next = index + 1
    const value = argv[next]
    const parsed = parseInt(value)
    if (!isNaN(parsed) && isFinite(parsed)) {
      options.runs = parsed
    }
  }
  return options
}
