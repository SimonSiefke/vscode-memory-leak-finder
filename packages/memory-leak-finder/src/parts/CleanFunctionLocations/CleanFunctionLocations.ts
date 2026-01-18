import * as Arrays from '../Arrays/Arrays.ts'

type FunctionLocation = {
  readonly count: number
  readonly name: string
  readonly [key: string]: unknown
}

const compareFunction = (a: FunctionLocation, b: FunctionLocation): number => {
  return b.count - a.count || a.name.localeCompare(b.name)
}

export const cleanFunctionLocations = (names: readonly string[], counts: readonly number[], functionLocations: readonly unknown[]): readonly FunctionLocation[] => {
  const instances: FunctionLocation[] = []
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
