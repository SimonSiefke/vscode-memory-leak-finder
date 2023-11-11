import * as CleanInstanceCount from '../CleanInstanceCount/CleanInstanceCount.js'

export const cleanInstanceCounts = (instances, constructorLocations, scriptMap) => {
  const cleanInstanceCounts = []
  for (let i = 0; i < instances.length; i++) {
    const instance = instances[i]
    const constructorLocation = constructorLocations[i]
    cleanInstanceCounts.push(CleanInstanceCount.cleanInstanceCount(instance, constructorLocation, scriptMap))
  }
  return cleanInstanceCounts
}
