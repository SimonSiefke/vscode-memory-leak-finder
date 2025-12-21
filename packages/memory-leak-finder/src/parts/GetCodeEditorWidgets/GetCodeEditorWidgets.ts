import type { Session } from '../Session/Session.ts'
import * as GetConstructorInstances from '../GetConstructorInstances/GetConstructorInstances.ts'

export const getCodeEditorWidgets = async (session: Session, objectGroup: string): Promise<any> => {
  return GetConstructorInstances.getConstructorInstances(session, objectGroup, 'CodeEditorWidget')
}
