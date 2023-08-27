import * as ParseArgv from '../ParseArgv/ParseArgv.js'
import * as Process from '../Process/Process.js'

export const getOptions = () => {
  const options = ParseArgv.parseArgv(Process.argv)
  return options
}
