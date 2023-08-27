export const parseArgv = (argv) => {
  const options = {
    watch: false,
    headless: false,
    checkLeaks: false,
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
  return options
}
