import * as NodePath from 'node:path'

export const join = (...parts) => {
  return NodePath.join(...parts)
}

const relative = (a, b) => {
  return NodePath.relative(a, b)
}

const dirname = (path) => {
  return NodePath.dirname(path)
}
