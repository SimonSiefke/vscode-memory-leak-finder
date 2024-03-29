import chalk from 'chalk'
import * as CliKeys from '../CliKeys/CliKeys.js'

const watchUsage = chalk.bold('Watch Usage: ')
const press = chalk.dim('Press ')
const toShowMore = chalk.dim(' to show more.')

const watchUsageShortMessage = `\n${watchUsage}${press}${CliKeys.WatchMode}${toShowMore}`

export const print = () => {
  return watchUsageShortMessage
}
