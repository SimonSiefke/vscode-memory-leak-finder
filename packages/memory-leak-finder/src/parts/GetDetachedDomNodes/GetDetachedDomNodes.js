import * as GetDescriptors from '../GetDescriptors/GetDescriptors.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

export const getDetachedDomNodes = async (session) => {
  const descriptors = await GetDescriptors.getDescriptors(session, PrototypeExpression.Node)
  return descriptors
}
