import * as IsEnumerable from '../IsEnumerable/IsEnumerable.js'

const getValue = (object) => {
  return object.value
}

export const getDescriptorValues = (properties) => {
  const descriptors = properties.filter(IsEnumerable.isEnumerable).map(getValue)
  return descriptors
}
