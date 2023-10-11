import * as Argv from '../Argv/Argv.js'
import * as ParseArgv from '../ParseArgv/ParseArgv.js'

export const getOptions = () => {
  const options = ParseArgv.parseArgv(Argv.argv)
  return options
}
