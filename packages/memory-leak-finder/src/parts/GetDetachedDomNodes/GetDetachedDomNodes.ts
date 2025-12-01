import * as GetDescriptors from '../GetDescriptors/GetDescriptors.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getDetachedDomNodes = async (session, objectGroup) => {
  const descriptors = await GetDescriptors.getDescriptors(session, PrototypeExpression.Node, objectGroup)
  return descriptors
}
