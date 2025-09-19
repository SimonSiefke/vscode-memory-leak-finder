import { ExpectError } from '../ExpectError/ExpectError.ts'
// import * as SessionState from '../SessionState/SessionState.ts'

const isWindow = (session) => {
  return session.type === 'page'
}

const waitForWindowCount = (count) => {
  const sessions = SessionState.getAllSessions()
  const windows = sessions.filter(isWindow)
  if (windows.length !== count) {
    throw new ExpectError(`expected window count to be ${count} but was ${windows.length}`)
  }
}

export const toHaveWindowCount = async (count) => {
  await waitForWindowCount(count)
}
