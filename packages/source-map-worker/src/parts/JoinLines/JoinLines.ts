import * as Character from '../Character/Character.js'

export const joinLines = (lines: string[]): string => {
  return lines.join(Character.NewLine)
}
