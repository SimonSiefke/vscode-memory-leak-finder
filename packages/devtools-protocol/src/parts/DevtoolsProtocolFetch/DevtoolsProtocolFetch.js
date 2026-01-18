import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as Invoke from '../Invoke/Invoke.js'

/**
 * @param {*} rpc
 * @param {{patterns?: Array<{urlPattern?: string, requestStage?: 'Request' | 'Response'}>}} options
 * @returns
 */
export const enable = (rpc, options = {}) => {
  return Invoke.invoke(rpc, DevtoolsCommandType.FetchEnable, options)
}

export const disable = (rpc) => {
  return Invoke.invoke(rpc, DevtoolsCommandType.FetchDisable, {})
}

/**
 * @param {*} rpc
 * @param {{requestId: string, url?: string, method?: string, postData?: string, headers?: Array<{name: string, value: string}>}} options
 * @returns
 */
export const continueRequest = (rpc, options) => {
  return Invoke.invoke(rpc, DevtoolsCommandType.FetchContinueRequest, options)
}

/**
 * @param {*} rpc
 * @param {{requestId: string, responseCode: number, responseHeaders?: Array<{name: string, value: string}>, body?: string}} options
 * @returns
 */
export const fulfillRequest = (rpc, options) => {
  return Invoke.invoke(rpc, DevtoolsCommandType.FetchFulfillRequest, options)
}
