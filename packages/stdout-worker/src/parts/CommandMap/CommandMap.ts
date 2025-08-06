import * as SpecialStdin from '../SpecialStdin/SpecialStdin.ts'
import * as Stdin from '../Stdin/Stdin.ts'
import * as Stdout from '../Stdout/Stdout.ts'

export const commandMap = {
  'SpecialStdin.start': SpecialStdin.start,
  'SpecialStdin.stop': SpecialStdin.stop,
  'Stdin.pause': Stdin.pause,
  'Stdin.resume': Stdin.resume,
  'Stdin.setEncoding': Stdin.setEncoding,
  'Stdin.setRawMode': Stdin.setRawMode,
  'Stdout.write': Stdout.write,
}
