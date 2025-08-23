import { VError } from '@lvce-editor/verror'
import type { Session } from '../Session/Session.ts'
import * as GetObjectCount from '../GetObjectCount/GetObjectCount.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getEditContextCount = async (session: Session, objectGroup: string): Promise<number> => {
  try {
    return await GetObjectCount.getObjectCount(session, PrototypeExpression.EditContext, objectGroup)
  } catch (error) {
    throw new VError(error, `Failed to get edit context count`)
  }
}
