import chalk from 'chalk'
import * as TestPrefixText from '../TestPrefixText/TestPrefixText.js'

export const Pass = chalk.reset.inverse.bold.green(TestPrefixText.Pass)

export const Leak = chalk.reset.inverse.blue(TestPrefixText.Leak)

export const Runs = chalk.reset.inverse.yellow.bold(TestPrefixText.Runs)

export const Fail = chalk.reset.inverse.bold.red(TestPrefixText.Fail)

export const UnexpectedError = chalk.reset.inverse.bold.red(TestPrefixText.UnexpectedError)
