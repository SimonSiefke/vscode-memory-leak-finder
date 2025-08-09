import chalk from 'chalk'
import * as TestPrefixText from '../TestPrefixText/TestPrefixText.ts'

export const Pass: string = chalk.reset.inverse.bold.green(TestPrefixText.Pass)

export const Leak: string = chalk.reset.inverse.blue(TestPrefixText.Leak)

export const Runs: string = chalk.reset.inverse.yellow.bold(TestPrefixText.Runs)

export const Setup: string = chalk.reset.inverse.yellow(TestPrefixText.Setup)

export const Fail: string = chalk.reset.inverse.bold.red(TestPrefixText.Fail)

export const UnexpectedError: string = chalk.reset.inverse.bold.red(TestPrefixText.UnexpectedError)
