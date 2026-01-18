import * as Arrays from '../Arrays/Arrays.ts'
import * as CleanInstanceCount from '../CleanInstanceCount/CleanInstanceCount.ts'

export const cleanInstanceCounts = (instances: readonly Record<string, unknown>[], constructorLocations: readonly { scriptId: string; lineNumber: number; columnNumber: number }[], scriptMap: unknown): readonly Record<string, unknown>[] => {
  const cleanInstanceCounts = Arrays.contextZipMap(instances, constructorLocations, CleanInstanceCount.cleanInstanceCount, scriptMap)
  return cleanInstanceCounts
}
