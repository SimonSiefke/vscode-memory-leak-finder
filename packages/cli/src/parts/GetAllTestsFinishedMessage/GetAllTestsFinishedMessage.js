import chalk from 'chalk'
import * as FormatAsSeconds from '../FormatAsSeconds/FormatAsSeconds.js'
import * as WatchUsageShort from '../WatchUsageShort/WatchUsageShort.js'

const ranAllTestSuits = chalk.dim('Ran all test suites.')
const ranAllTestSuitsMatching = chalk.dim('Ran all test suites matching')
const dot = chalk.dim('.')
const time = chalk.bold(`Time:`)

const testSuites = chalk.bold(`Test Suites:`)

const getRanAllTestSuitesMessage = (filterValue) => {
  if (filterValue === '') {
    return ranAllTestSuits
  }
  return `${ranAllTestSuitsMatching} /${filterValue}/i${dot}`
}

export const getAllTestsFinishedMessage = (passed, failed, skipped, total, duration, filterValue) => {
  const failedMessage = failed ? `${chalk.bold.red(`${failed} failed`)}, ` : ''
  const skippedMessage = skipped ? `${chalk.bold.yellow(`${skipped} skipped`)}, ` : ''
  const passedMessage = passed ? `${chalk.bold.green(`${passed} passed`)}, ` : ''
  const durationMessage = FormatAsSeconds.formatAsSeconds(duration)
  const ranAllTestSuitesMessage = getRanAllTestSuitesMessage(filterValue)
  return `
${testSuites} ${failedMessage}${skippedMessage}${passedMessage}${total} total
${time}        ${durationMessage}
${ranAllTestSuitesMessage}
${WatchUsageShort.print()}`
}
