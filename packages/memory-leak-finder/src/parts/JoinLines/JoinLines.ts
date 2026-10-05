import type { Dynamic } from '../Types/Types.ts'
import * as Character from '../Character/Character.ts'
export const joinLines = (lines: Dynamic) => {
  return lines.join(Character.NewLine)
}
