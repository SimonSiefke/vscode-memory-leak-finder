import type { Session } from '../Session/Session.ts'
import * as GetDescriptors from '../GetDescriptors/GetDescriptors.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getDetachedDomNodes = async (session: Session, objectGroup: string) => {
  const descriptors = await GetDescriptors.getDescriptors(session, PrototypeExpression.Node, objectGroup)
  return descriptors
}
