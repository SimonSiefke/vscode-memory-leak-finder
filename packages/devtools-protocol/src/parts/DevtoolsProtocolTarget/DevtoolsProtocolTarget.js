import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import { DevtoolsProtocolError } from '../DevtoolsProtocolError/DevtoolsProtocolError.js'

/**
 *
 * @param {{autoAttach:boolean, waitForDebuggerOnStart:boolean, flatten?:boolean}} options
 */
export const setAutoAttach = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.TargetSetAutoAttach, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

/**
 *
 */
export const attachToBrowserTarget = async (rpc) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.TargetAttachToBrowserTarget)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

/**
 *
 * @param {{discover:true}} options
 */
export const setDiscoverTargets = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.TargetSetDiscoverTargets, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

export const getTargets = async (rpc) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.TargetGetTargets)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
  return rawResult.result.targetInfos
}

/**
 *
 * @param {{targetId:string, flatten?:boolean}} options
 * @returns
 */
export const attachToTarget = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.TargetAttachToTarget, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
  return rawResult.result.sessionId
}
