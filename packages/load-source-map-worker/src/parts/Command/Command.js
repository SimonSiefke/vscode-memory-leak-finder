import { CommandNotFoundError } from '../CommandNotFoundError/CommandNotFoundError.js'
import * as CommandState from '../CommandState/CommandState.js'

export const execute = (command, ...args) => {
  const fn = CommandState.getCommand(command)
  if (!fn) {
    throw new CommandNotFoundError(command)
  }
  return fn(...args)
}
