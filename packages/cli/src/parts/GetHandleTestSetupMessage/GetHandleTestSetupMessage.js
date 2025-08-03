import chalk from 'chalk'
import * as TestPrefix from '../TestPrefix/TestPrefix.js'

export const getHandleTestSetupMessage = () => {
  const setupMessage = chalk.dim('Launching IDE and connecting to devtools...')
  return `\n${TestPrefix.Setup} ${setupMessage}\n`
}