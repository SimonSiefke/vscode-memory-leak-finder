import { AssertionError } from '../AssertionError/AssertionError.js'

/**
 * @param {unknown} value
 */
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

/**
 * @param {unknown} value
 */
export const object = (value) => {
  const type = getType(value)
  if (type !== 'object') {
    throw new AssertionError('expected value to be of type object')
  }
}

/**
 * @param {unknown} value
 */
export const number = (value) => {
  const type = getType(value)
  if (type !== 'number') {
    throw new AssertionError('expected value to be of type number')
  }
}

/**
 * @param {unknown} value
 */
export const array = (value) => {
  const type = getType(value)
  if (type !== 'array') {
    throw new AssertionError('expected value to be of type array')
  }
}

/**
 * @param {unknown} value
 */
export const string = (value) => {
  const type = getType(value)
  if (type !== 'string') {
    throw new AssertionError('expected value to be of type string')
  }
}

/**
 * @param {unknown} value
 */
export const boolean = (value) => {
  const type = getType(value)
  if (type !== 'boolean') {
    throw new AssertionError('expected value to be of type boolean')
  }
}

/**
 * @param {unknown} value
 */
export const fn = (value) => {
  const type = getType(value)
  if (type !== 'function') {
    throw new AssertionError('expected value to be of type function')
  }
}
