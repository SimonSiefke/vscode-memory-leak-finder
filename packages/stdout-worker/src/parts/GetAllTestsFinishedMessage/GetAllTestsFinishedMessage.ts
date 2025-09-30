import chalk from 'chalk'
import * as Character from '../Character/Character.ts'
import * as FormatAsSeconds from '../FormatAsSeconds/FormatAsSeconds.ts'
import * as WatchUsageShort from '../GetWatchUsageMessageShort/GetWatchUsageMessageShort.ts'

const ranAllTestSuits: string = chalk.dim('Ran all test suites.')
const ranAllTestSuitsMatching: string = chalk.dim('Ran all test suites matching')
const dot: string = chalk.dim('.')
const time: string = chalk.bold(`Time:`)

const testSuites: string = chalk.bold(`Test Suites:`)

const getRanAllTestSuitesMessage = (filterValue: string): string => {
  if (filterValue === Character.EmptyString) {
    return ranAllTestSuits
  }
  return `${ranAllTestSuitsMatching} /${filterValue}/i${dot}`
}

export const getAllTestsFinishedMessage = (
  passed: number,
  failed: number,
  skipped: number,
  skippedFailed: number,
  leaked: number,
  total: number,
  duration: number,
  filterValue: string,
  isWatchMode: boolean,
): string => {
  const failedMessage: string = failed ? `${chalk.bold.red(`${failed} failed`)}, ` : Character.EmptyString
  const skippedMessage: string = skipped ? `${chalk.bold.yellow(`${skipped} skipped`)}, ` : Character.EmptyString
  const skippedFailedMessage: string = skippedFailed ? `${chalk.bold.magenta(`${skippedFailed} skipped-failed`)}, ` : Character.EmptyString
  const passedMessage: string = passed ? `${chalk.bold.green(`${passed} passed`)}, ` : Character.EmptyString
  const leakedMessage: string = leaked ? `${chalk.bold.blue(`${leaked} leaked`)}, ` : Character.EmptyString
  const durationMessage: string = FormatAsSeconds.formatAsSeconds(duration)
  const ranAllTestSuitesMessage: string = getRanAllTestSuitesMessage(filterValue)
  let message: string = `
${testSuites} ${failedMessage}${skippedMessage}${skippedFailedMessage}${passedMessage}${leakedMessage}${total} total
${time}        ${durationMessage}
${ranAllTestSuitesMessage}\n`
  if (isWatchMode) {
    message += `${WatchUsageShort.getWatchUsageMessageShort()}`
  }
  return message
}
