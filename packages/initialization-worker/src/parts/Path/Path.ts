import * as NodePath from 'node:path'

export const join = (...parts: string[]): string => {
  return NodePath.join(...parts)
}
