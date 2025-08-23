import type { Session } from '../Session/Session.ts'
import * as GetStrings from '../GetStrings/GetStrings.ts'

export const getStringCount = async (session: Session, objectGroup: string, id: any): Promise<number> => {
  const strings = await GetStrings.getStrings(session, objectGroup, id)
  const stringCount = strings.length
  return stringCount
}
