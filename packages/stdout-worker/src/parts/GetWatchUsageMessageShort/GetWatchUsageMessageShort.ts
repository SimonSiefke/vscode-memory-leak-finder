import { chalk } from '../Chalk/Chalk.ts'
import * as CliKeys from '../CliKeys/CliKeys.ts'

const watchUsage: string = chalk.bold('Watch Usage: ')
const press: string = chalk.dim('Press ')
const toShowMore: string = chalk.dim(' to show more.')

const watchUsageShortMessage: string = `\n${watchUsage}${press}${CliKeys.WatchMode}${toShowMore}`

export const getWatchUsageMessageShort = (): string => {
  return watchUsageShortMessage
}
