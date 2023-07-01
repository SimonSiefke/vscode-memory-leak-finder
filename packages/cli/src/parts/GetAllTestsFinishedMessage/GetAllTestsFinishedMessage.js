import chalk from 'chalk'
import * as FormatAsSeconds from '../FormatAsSeconds/FormatAsSeconds.js'
import * as WatchUsageShort from '../WatchUsageShort/WatchUsageShort.js'
import * as Character from '../Character/Character.js'

const ranAllTestSuits = chalk.dim('Ran all test suites.')
const ranAllTestSuitsMatching = chalk.dim('Ran all test suites matching')
const dot = chalk.dim('.')
const time = chalk.bold(`Time:`)

const testSuites = chalk.bold(`Test Suites:`)

const getRanAllTestSuitesMessage = (filterValue) => {
  if (filterValue === Character.EmptyString) {
    return ranAllTestSuits
  }
  return `${ranAllTestSuitsMatching} /${filterValue}/i${dot}`
}

export const getAllTestsFinishedMessage = (passed, failed, skipped, total, duration, filterValue, isWatchMode) => {
  const failedMessage = failed ? `${chalk.bold.red(`${failed} failed`)}, ` : Character.EmptyString
  const skippedMessage = skipped ? `${chalk.bold.yellow(`${skipped} skipped`)}, ` : Character.EmptyString
  const passedMessage = passed ? `${chalk.bold.green(`${passed} passed`)}, ` : Character.EmptyString
  const durationMessage = FormatAsSeconds.formatAsSeconds(duration)
  const ranAllTestSuitesMessage = getRanAllTestSuitesMessage(filterValue)
  let message = `
${testSuites} ${failedMessage}${skippedMessage}${passedMessage}${total} total
${time}        ${durationMessage}
${ranAllTestSuitesMessage}\n`
  if (isWatchMode) {
    message += `${WatchUsageShort.print()}`
  }
  return message
}
