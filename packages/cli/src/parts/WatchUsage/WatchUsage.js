import chalk from 'chalk'
import * as CliKeys from '../CliKeys/CliKeys.js'

const watchUsage = chalk.bold('Watch Usage')
const press = chalk.dim(' \u203A Press ')
const toRunAllTests = chalk.dim(' to run all tests.')
const toRunOnlyFailedTests = chalk.dim(' to run only failed tests.')
const toTriggerATestRun = chalk.dim(' to trigger a test run.')
const toFilterTests = chalk.dim(' to filter tests by a filename regex pattern.')
const toQuitWatchMode = chalk.dim(' quit watch mode.')

export const print = () => {
  return `
${watchUsage}
${press}${CliKeys.All}${toRunAllTests}
${press}${CliKeys.Fail}${toRunOnlyFailedTests}
${press}${CliKeys.FilterMode}${toFilterTests}
${press}${CliKeys.Quit}${toQuitWatchMode}
${press}${CliKeys.TriggerTestRun}${toTriggerATestRun}
`
}
