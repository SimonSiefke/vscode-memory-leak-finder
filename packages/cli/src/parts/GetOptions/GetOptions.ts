import * as Argv from '../Argv/Argv.js'
import * as ParseArgv from '../ParseArgv/ParseArgv.js'

export const getOptions = () => {
  return ParseArgv.parseArgv(Argv.argv)
}
