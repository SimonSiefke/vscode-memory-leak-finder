import * as ErrorCodes from '../ErrorCodes/ErrorCodes.js'

export class LaunchError extends Error {
  constructor(message) {
    super(message)
    this.name = 'LaunchError'
    this.code = ErrorCodes.E_LAUNCH_ERROR
  }
}
