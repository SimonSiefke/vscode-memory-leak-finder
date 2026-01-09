import * as Exit from '../Exit/Exit.ts'
import * as IsVscodeDownloaded from '../IsVscodeDownloaded/IsVscodeDownloaded.ts'
import * as PrepareBoth from '../Launch/Launch.ts'
import * as SetProxyCurrentTestName from '../SetProxyCurrentTestName/SetProxyCurrentTestName.ts'

export const commandMap = {
  'Launch.exit': Exit.exit,
  'Launch.isVscodeDownloaded': IsVscodeDownloaded.isVscodeDownloaded,
  'Launch.launch': PrepareBoth.launch,
  'Launch.setProxyCurrentTestName': SetProxyCurrentTestName.setProxyCurrentTestName,
}
