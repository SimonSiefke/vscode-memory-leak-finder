import * as Character from '../Character/Character.ts'

const indentLine = (line: string): string => {
  return '    ' + line
}

export const indent = (string: string): string => {
  if (!string) {
    return Character.EmptyString
  }
  return string.split('\n').map(indentLine).join('\n')
}
