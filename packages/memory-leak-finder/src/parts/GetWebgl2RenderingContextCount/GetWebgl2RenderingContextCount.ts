import { VError } from '@lvce-editor/verror'
import type { Session } from '../Session/Session.ts'
import * as GetObjectCount from '../GetObjectCount/GetObjectCount.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getWebgl2RenderingContextCount = async (session: Session, objectGroup?: string): Promise<number> => {
  try {
    return await GetObjectCount.getObjectCount(session, PrototypeExpression.Webgl2RenderingContext, objectGroup)
  } catch (error) {
    throw new VError(error, `Failed to get webgl2 rendering context count`)
  }
}
