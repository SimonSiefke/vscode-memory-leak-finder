import * as Character from '../Character/Character.js'

const indentLine = (line) => {
  return '    ' + line
}

export const indent = (string) => {
  if (!string) {
    return Character.EmptyString
  }
  return string.split('\n').map(indentLine).join('\n')
}
