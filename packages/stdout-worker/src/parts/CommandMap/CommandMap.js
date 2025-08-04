import * as Stdin from '../Stdin/Stdin.js'
import * as Stdout from '../Stdout/Stdout.js'

export const commandMap = {
  'Stdin.pause': Stdin.pause,
  'Stdin.resume': Stdin.resume,
  'Stdin.setEncoding': Stdin.setEncoding,
  'Stdin.setRawMode': Stdin.setRawMode,
  'Stdout.write': Stdout.write,
}
