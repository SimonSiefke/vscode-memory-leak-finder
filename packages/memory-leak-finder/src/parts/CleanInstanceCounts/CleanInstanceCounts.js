import * as Arrays from '../Arrays/Arrays.js'
import * as CleanInstanceCount from '../CleanInstanceCount/CleanInstanceCount.js'

export const cleanInstanceCounts = (instances, constructorLocations, scriptMap) => {
  const cleanInstanceCounts = Arrays.contextZipMap(instances, constructorLocations, CleanInstanceCount.cleanInstanceCount, scriptMap)
  return cleanInstanceCounts
}
