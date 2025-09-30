import chalk from 'chalk'
import * as TestPrefixText from '../TestPrefixText/TestPrefixText.ts'

export const Pass: string = chalk.reset.inverse.bold.green(TestPrefixText.Pass)

export const SkipPass: string = chalk.reset.inverse.bold.magenta(TestPrefixText.SkipPass)

export const Initialized: string = chalk.reset.inverse.bold.green(TestPrefixText.Initialized)

export const Leak: string = chalk.reset.inverse.blue(TestPrefixText.Leak)

export const Runs: string = chalk.reset.inverse.yellow.bold(TestPrefixText.Runs)

export const Initialize: string = chalk.reset.inverse.yellow.bold(TestPrefixText.Initializing)

export const Setup: string = chalk.reset.inverse.yellow(TestPrefixText.Setup)

export const Fail: string = chalk.reset.inverse.bold.red(TestPrefixText.Fail)

export const SkipFail: string = chalk.reset.inverse.bold.magenta(TestPrefixText.SkipFail)

export const UnexpectedError: string = chalk.reset.inverse.bold.red(TestPrefixText.UnexpectedError)
