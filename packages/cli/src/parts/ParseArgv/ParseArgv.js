export const parseArgv = (argv) => {
  const options = {
    watch: false,
    headless: false,
  }
  if (argv.includes('--watch')) {
    options.watch = true
  }
  if (argv.includes('--headless')) {
    options.headless = true
  }
  return options
}
