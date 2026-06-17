import type { Dynamic } from '../Types/Types.ts'
import * as Arrays from '../Arrays/Arrays.ts'
import * as CleanInstanceCount from '../CleanInstanceCount/CleanInstanceCount.ts'
export const cleanInstanceCounts = (instances: Dynamic, constructorLocations: Dynamic, scriptMap: Dynamic) => {
  const cleanInstanceCounts = Arrays.contextZipMap(instances, constructorLocations, CleanInstanceCount.cleanInstanceCount, scriptMap)
  return cleanInstanceCounts
}
