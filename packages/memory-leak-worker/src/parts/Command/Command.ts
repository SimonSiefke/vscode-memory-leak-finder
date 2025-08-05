import { CommandNotFoundError } from '../CommandNotFoundError/CommandNotFoundError.ts'
import * as CommandState from '../CommandState/CommandState.ts'

import type { ExecuteFunction } from '../Types/Types.ts'

export const execute: ExecuteFunction = (command: string, ...args: unknown[]): unknown => {
  const fn = CommandState.getCommand(command)
  if (!fn) {
    throw new CommandNotFoundError(command)
  }
  return fn(...args)
}
