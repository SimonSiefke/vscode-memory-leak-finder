import * as NodePath from 'node:path'

export const join = (...parts) => {
  return NodePath.join(...parts)
}

export const relative = (a, b) => {
  return NodePath.relative(a, b)
}

export const dirname = (path) => {
  return NodePath.dirname(path)
}
