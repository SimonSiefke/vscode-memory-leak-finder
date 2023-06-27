// TODO treeshake out this whole module in production

import { AssertionError } from '../AssertionError/AssertionError.js'

const getType = (value) => {
  switch (typeof value) {
    case 'number':
      return 'number'
    case 'function':
      return 'function'
    case 'string':
      return 'string'
    case 'object':
      if (value === null) {
        return 'null'
      }
      if (Array.isArray(value)) {
        return 'array'
      }
      return 'object'
    case 'boolean':
      return 'boolean'
    default:
      return 'unknown'
  }
}

export const object = (value) => {
  const type = getType(value)
  if (type !== 'object') {
    throw new AssertionError('expected value to be of type object')
  }
}

export const number = (value) => {
  const type = getType(value)
  if (type !== 'number') {
    throw new AssertionError('expected value to be of type number')
  }
}

export const array = (value) => {
  const type = getType(value)
  if (type !== 'array') {
    throw new AssertionError('expected value to be of type array')
  }
}

export const float32Array = (value) => {
  if (!(value instanceof Float32Array)) {
    throw new Error('expected value to be of float32Array')
  }
}

export const string = (value) => {
  const type = getType(value)
  if (type !== 'string') {
    throw new AssertionError('expected value to be of type string')
  }
}

export const null_ = (value) => {
  const type = getType(value)
  if (type !== 'null') {
    throw new AssertionError('expected value to be of type null')
  }
}

export const boolean = (value) => {
  const type = getType(value)
  if (type !== 'boolean') {
    throw new AssertionError('expected value to be of type boolean')
  }
}
