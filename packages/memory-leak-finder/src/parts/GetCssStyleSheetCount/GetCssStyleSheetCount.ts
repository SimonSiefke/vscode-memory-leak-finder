import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getCssStyleSheetCount = async (session: Session, objectGroup: string): Promise<number> => {
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
