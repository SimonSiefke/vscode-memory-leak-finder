import * as os from 'node:os'
import * as Argv from '../Argv/Argv.ts'
import * as ParseArgv from '../ParseArgv/ParseArgv.ts'

export const getOptions = () => {
  return ParseArgv.parseArgv(process.platform, os.arch(), Argv.argv)
}
