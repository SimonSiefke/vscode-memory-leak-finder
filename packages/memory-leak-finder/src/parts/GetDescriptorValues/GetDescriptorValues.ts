import type { Dynamic } from '../Types/Types.ts'
import * as GetValue from '../GetValue/GetValue.ts'
import * as IsEnumerable from '../IsEnumerable/IsEnumerable.ts'
export const getDescriptorValues = (properties: Dynamic) => {
  const descriptors = properties.filter(IsEnumerable.isEnumerable).map(GetValue.getValue)
  return descriptors
}
