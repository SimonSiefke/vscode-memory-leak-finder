import * as Character from '../Character/Character.ts'

export const joinLines = (lines: string[]): string => {
  return lines.join(Character.NewLine)
}
