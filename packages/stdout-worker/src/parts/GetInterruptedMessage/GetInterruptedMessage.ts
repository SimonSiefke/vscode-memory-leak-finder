import chalk from 'chalk'

const interruptedText: string = 'Test run was interrupted.'

const interruptedMessage: string = chalk.bold.red(interruptedText)

export const getInterruptedMessage = (): string => {
  return interruptedMessage
}
