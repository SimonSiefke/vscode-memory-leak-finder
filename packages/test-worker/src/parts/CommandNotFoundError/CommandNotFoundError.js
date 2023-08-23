import * as ErrorCodes from '../ErrorCodes/ErrorCodes.js'

export class CommandNotFoundError extends Error {
  constructor(id) {
    super(`command ${id} not found`)
    this.name = 'CommandNotFoundError'
    this.code = ErrorCodes.E_COMMAND_NOT_FOUND
  }
}
