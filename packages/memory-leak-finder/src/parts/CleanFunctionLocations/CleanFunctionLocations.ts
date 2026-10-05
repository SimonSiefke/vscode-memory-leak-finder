import type { Dynamic } from '../Types/Types.ts'
import * as Arrays from '../Arrays/Arrays.ts'
const compareFunction = (a: Dynamic, b: Dynamic) => {
  return b.count - a.count || a.name.localeCompare(b.name)
}
export const cleanFunctionLocations = (names: Dynamic, counts: Dynamic, functionLocations: Dynamic) => {
  const instances: Dynamic[] = []
  for (let i = 0; i < functionLocations.length; i++) {
    const name = names[i]
    const count = counts[i]
    const functionLocation = functionLocations[i]
    instances.push({
      ...functionLocation,
      count,
      name,
    })
  }
  const sorted = Arrays.toSorted(instances, compareFunction)
  return sorted
}
