import type { Session } from '../Session/Session.ts'
import * as GetConstructorInstanceCount from '../GetConstructorInstanceCount/GetConstructorInstanceCount.ts'

export const getCodeEditorWidgetCount = async (session: Session, objectGroup: string): Promise<number> => {
  return GetConstructorInstanceCount.getConstructorInstanceCount(session, objectGroup, 'CodeEditorWidget')
}
