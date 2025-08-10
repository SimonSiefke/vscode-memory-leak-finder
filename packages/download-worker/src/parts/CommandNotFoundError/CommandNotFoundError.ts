import * as ErrorCodes from '../ErrorCodes/ErrorCodes.ts'

export class CommandNotFoundError extends Error {
  public code: string

  constructor(id: string) {
    super(`command ${id} not found`)
    this.name = 'CommandNotFoundError'
    this.code = ErrorCodes.E_COMMAND_NOT_FOUND
  }
}
