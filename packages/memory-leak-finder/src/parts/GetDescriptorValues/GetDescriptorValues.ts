import * as GetValue from '../GetValue/GetValue.js'
import * as IsEnumerable from '../IsEnumerable/IsEnumerable.js'

export const getDescriptorValues = (properties) => {
  const descriptors = properties.filter(IsEnumerable.isEnumerable).map(GetValue.getValue)
  return descriptors
}
