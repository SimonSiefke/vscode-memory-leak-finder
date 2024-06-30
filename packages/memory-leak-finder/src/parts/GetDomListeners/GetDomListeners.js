import * as GetConstructorInstances from '../GetConstructorInstances/GetConstructorInstances.js'

export const getDomListeners = async (session, objectGroup) => {
  const instances = await GetConstructorInstances.getConstructorInstances(session, objectGroup, 'DomListener')
  console.log({ instances })
  return []
}
