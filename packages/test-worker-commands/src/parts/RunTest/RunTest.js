import VError from 'verror'
import * as PageObjectState from '../PageObjectState/PageObjectState.js'
import * as RunTestWithCallback from '../RunTestWithCallback/RunTestWithCallback.js'

export const runTest = async (pageObjectId, file, root, color) => {
  const pageObject = PageObjectState.get(pageObjectId)
  if (!pageObject) {
    throw new VError(`no page object ${pageObjectId} found`)
  }
  const stats = await RunTestWithCallback.runTestWithCallback(pageObject, file, root, color)
  return stats
}
