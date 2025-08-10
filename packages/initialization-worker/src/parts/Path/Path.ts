import * as NodePath from 'node:path'

export const join = (...parts) => {
  return NodePath.join(...parts)
}
