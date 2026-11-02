import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import { inspectChildProcess } from '../InspectChildProcess/InspectChildProcess.ts'

export const getExternalRuntimeInfo = async (connectionId: number, processName = '', rootPid = 0) => {
  if (processName && rootPid) {
    const childProcess = await inspectChildProcess(rootPid, processName)
    if (childProcess) {
      return childProcess
    }
  }
  const pageObject = PageObjectState.getPageObject(connectionId)
  if (!pageObject.ExternalRuntime || typeof pageObject.ExternalRuntime.getRuntimeInfo !== 'function') {
    throw new Error('Expected ExternalRuntime page object to expose getRuntimeInfo')
  }
  return pageObject.ExternalRuntime.getRuntimeInfo()
}
