import * as ErrorCodes from '../ErrorCodes/ErrorCodes.ts'

export class LaunchError extends Error {
  code: string
  constructor(message) {
    super(message)
    this.name = 'LaunchError'
    this.code = ErrorCodes.E_LAUNCH_ERROR
  }
}
