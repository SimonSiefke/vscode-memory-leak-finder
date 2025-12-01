import * as Argv from '../Argv/Argv.ts'
import * as ParseArgv from '../ParseArgv/ParseArgv.ts'

export const getOptions = () => {
  return ParseArgv.parseArgv(Argv.argv)
}
