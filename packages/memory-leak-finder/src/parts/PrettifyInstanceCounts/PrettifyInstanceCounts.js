import * as CompareInstance from '../CompareInstance/CompareInstance.js'

export const prettifyInstanceCounts = (instances) => {
  const prettyInstances = [...instances].sort(CompareInstance.compareInstance)
  return prettyInstances
}
