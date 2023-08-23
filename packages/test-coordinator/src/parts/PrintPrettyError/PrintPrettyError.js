import * as Logger from '../Logger/Logger.js'

export const printPrettyError = (prettyError, prefix = '') => {
  Logger.error(`${prefix}${prettyError.type}: ${prettyError.message}\n\n${prettyError.codeFrame}\n\n${prettyError.stack}\n`)
}
