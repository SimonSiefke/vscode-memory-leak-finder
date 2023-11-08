import * as Logger from '../Logger/Logger.js'

export const prepare = (error) => {
  try {
    return {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      code: error.code,
    }
  } catch (otherError) {
    Logger.warn(`ErrorHandling Error: ${otherError}`)
    return error
  }
}
