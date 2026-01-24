import type { Session } from '../Session/Session.ts'
import { getIpcMessages } from '../GetIpcMessages/GetIpcMessages.ts'

export const getIpcMessageCount = async (session: Session, objectGroup: string): Promise<any> => {
  return getIpcMessages(session)
}
