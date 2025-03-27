import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getCssInlineStyleCount = async (session, objectGroup) => {
  const ruleCount = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `1+1`,
    returnByValue: true,
    objectGroup,
  })
  return ruleCount
}
