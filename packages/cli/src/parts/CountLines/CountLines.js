import * as Character from '../Character/Character.js'

export const countLines = (message) => {
  let lines = 1
  for (const character of message) {
    if (character === Character.NewLine) {
      lines++
    }
  }
  return lines
}
