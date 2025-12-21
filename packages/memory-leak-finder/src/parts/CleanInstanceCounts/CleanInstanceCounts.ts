import * as Arrays from '../Arrays/Arrays.ts'
import * as CleanInstanceCount from '../CleanInstanceCount/CleanInstanceCount.ts'

export const cleanInstanceCounts = (instances, constructorLocations, scriptMap) => {
  const cleanInstanceCounts = Arrays.contextZipMap(instances, constructorLocations, CleanInstanceCount.cleanInstanceCount, scriptMap)
  return cleanInstanceCounts
}
