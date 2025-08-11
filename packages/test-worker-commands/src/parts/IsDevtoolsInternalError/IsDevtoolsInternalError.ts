import * as ErrorCodes from '../ErrorCodes/ErrorCodes.js'

export const isDevtoolsInternalError = (error) => {
  return error && error.code === ErrorCodes.E_DEVTOOLS_INTERNAL_ERROR
}
