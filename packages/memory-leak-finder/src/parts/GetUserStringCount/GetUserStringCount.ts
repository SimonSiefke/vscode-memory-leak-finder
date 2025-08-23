import type { Session } from '../Session/Session.ts'
import * as GetUserStrings from '../GetUserStrings/GetUserStrings.ts'

export const getUserStringCount = async (session: Session, objectGroup: string, id: any): Promise<number> => {
  const strings = await GetUserStrings.getUserStrings(session, objectGroup, id)
  const stringCount = strings.length
  return stringCount
}
