import * as ErrorCodes from '../ErrorCodes/ErrorCodes.ts'

export const isDevtoolsInternalError = (error: any) => {
  return error && error.code === ErrorCodes.E_DEVTOOLS_INTERNAL_ERROR
}
