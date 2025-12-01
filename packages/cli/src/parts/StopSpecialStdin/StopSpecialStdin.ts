import * as Character from '../Character/Character.ts'
import * as Stdin from '../Stdin/Stdin.ts'
import * as Stdout from '../Stdout/Stdout.ts'

export const stopSpecialStdin = async (): Promise<void> => {
  // TODO use worker for stdin
  await Stdin.pause()
  await Stdout.write(Character.NewLine)
}
