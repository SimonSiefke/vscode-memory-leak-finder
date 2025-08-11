import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getCssStyleSheetCount = async (session, objectGroup) => {
  const count = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `function getStyleSheetCount() {
  let totalRules = 0;
  const styleSheets = Array.from(document.styleSheets);
  return styleSheets.length
}

;(getStyleSheetCount())`,
    returnByValue: true,
    objectGroup,
  })
  return count
}
