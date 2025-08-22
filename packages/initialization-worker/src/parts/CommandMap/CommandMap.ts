import * as Exit from '../Exit/Exit.ts'
import * as PrepareBoth from '../PrepareBoth/PrepareBoth.ts'

export const commandMap = {
  'Initialize.prepare': PrepareBoth.prepareBoth,
  'Initialize.exit': Exit.exit,
  'Initialize.undoMonkeyPatch': PrepareBoth.undoMonkeyPatch,
}
