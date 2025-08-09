import * as PrepareBoth from '../PrepareBoth/PrepareBoth.js'
import * as Exit from '../Exit/Exit.js'

export const commandMap = {
  'Initialize.prepare': PrepareBoth.prepareBoth,
  'Initialize.exit': Exit.exit,
  'Initialize.undoMonkeyPatch': PrepareBoth.undoMonkeyPatch,
}
