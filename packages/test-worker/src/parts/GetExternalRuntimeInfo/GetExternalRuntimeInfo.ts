import * as PageObjectState from '../PageObjectState/PageObjectState.ts'

export const getExternalRuntimeInfo = async (connectionId: number) => {
  const pageObject = PageObjectState.getPageObject(connectionId)
  if (!pageObject.ExternalRuntime || typeof pageObject.ExternalRuntime.getRuntimeInfo !== 'function') {
    throw new Error('Expected ExternalRuntime page object to expose getRuntimeInfo')
  }
  return pageObject.ExternalRuntime.getRuntimeInfo()
}
