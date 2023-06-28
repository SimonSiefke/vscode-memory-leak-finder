import chalk from 'chalk'

const interruptedText = 'Test run was interrupted.'

const interruptedMessage = chalk.bold.red(interruptedText)

export const print = () => {
  return interruptedMessage
}
