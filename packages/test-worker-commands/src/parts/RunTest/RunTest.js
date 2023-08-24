import VError from 'verror'
import * as Assert from '../Assert/Assert.js'
import * as PageObjectState from '../PageObjectState/PageObjectState.js'
import * as RunTestWithCallback from '../RunTestWithCallback/RunTestWithCallback.js'

export const runTest = async (connectionId, absolutePath, root, color) => {
  Assert.number(connectionId)
  Assert.string(absolutePath)
  Assert.string(root)
  Assert.boolean(color)
  const pageObject = PageObjectState.get(connectionId)
  if (!pageObject) {
    throw new VError(`no page object ${connectionId} found`)
  }
  const stats = await RunTestWithCallback.runTestWithCallback(pageObject, absolutePath, root, color)
  return stats
}
