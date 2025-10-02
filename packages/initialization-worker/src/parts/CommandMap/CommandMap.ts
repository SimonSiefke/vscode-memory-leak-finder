import * as PrepareBoth from '../PrepareBoth/PrepareBoth.ts'
import * as Exit from '../Exit/Exit.ts'

export const commandMap = {
  'Initialize.prepare': PrepareBoth.prepareBoth,
  'Initialize.exit': Exit.exit,
}
