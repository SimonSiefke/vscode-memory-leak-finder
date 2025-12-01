import { ExpectError } from '../ExpectError/ExpectError.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'

const waitForWindowCount = (count) => {
  const connectionId = 1
  const pageObject = PageObjectState.getPageObjectContext(connectionId)
  const windows = pageObject.getWindows()
  if (windows.length !== count) {
    throw new ExpectError(`expected window count to be ${count} but was ${windows.length}`)
  }
}

export const toHaveWindowCount = async (count) => {
  await waitForWindowCount(count)
}
