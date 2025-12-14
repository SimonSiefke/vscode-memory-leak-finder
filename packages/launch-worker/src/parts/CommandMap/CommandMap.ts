import * as PrepareBoth from '../Launch/Launch.ts'
import * as Exit from '../Exit/Exit.ts'
import * as IsVscodeDownloaded from '../IsVscodeDownloaded/IsVscodeDownloaded.ts'

export const commandMap = {
  'Launch.launch': PrepareBoth.launch,
  'Launch.exit': Exit.exit,
  'Launch.isVscodeDownloaded': IsVscodeDownloaded.isVscodeDownloaded,
}
