import * as NodePath from 'node:path'

export const join = (...parts: string[]): string => {
  return NodePath.join(...parts)
}

export const relative = (a: string, b: string): string => {
  return NodePath.relative(a, b)
}

export const dirname = (path: string): string => {
  return NodePath.dirname(path)
}

