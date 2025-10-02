import * as PrepareBoth from '../Launch/Launch.ts'
import * as Exit from '../Exit/Exit.ts'

export const commandMap = {
  'Launch.launch': PrepareBoth.launch,
  'Launch.exit': Exit.exit,
}
