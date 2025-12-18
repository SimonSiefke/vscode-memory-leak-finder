import { VError } from '@lvce-editor/verror'
import type { Session } from '../Session/Session.ts'
import * as GetObjectCount from '../GetObjectCount/GetObjectCount.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getTrustedTypePolicyCount = async (session: Session, objectGroup?: string): Promise<number> => {
  try {
    return await GetObjectCount.getObjectCount(session, PrototypeExpression.TrustedTypePolicy, objectGroup)
  } catch (error) {
    throw new VError(error, `Failed to get trusted type policy count`)
  }
}
