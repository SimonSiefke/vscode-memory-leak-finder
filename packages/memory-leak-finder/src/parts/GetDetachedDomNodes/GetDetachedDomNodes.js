import * as GetDescriptors from '../GetDescriptors/GetDescriptors.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

export const getDetachedDomNodes = async (session, objectGroup) => {
  const descriptors = await GetDescriptors.getDescriptors(session, PrototypeExpression.Node, objectGroup)
  return descriptors
}
