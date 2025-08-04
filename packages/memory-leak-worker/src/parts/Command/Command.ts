import { CommandNotFoundError } from '../CommandNotFoundError/CommandNotFoundError.js'
import * as CommandState from '../CommandState/CommandState.js'

import type { ExecuteFunction } from '../Types/Types.js'

export const execute: ExecuteFunction = (command: string, ...args: unknown[]): unknown => {
  const fn = CommandState.getCommand(command)
  if (!fn) {
    throw new CommandNotFoundError(command)
  }
  return fn(...args)
}
