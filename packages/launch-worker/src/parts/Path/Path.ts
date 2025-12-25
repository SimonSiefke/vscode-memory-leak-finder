import * as NodePath from 'node:path'

export const join = (...parts: string[]) => {
  return NodePath.join(...parts)
}
