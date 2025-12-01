import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getCssRules = async (session: Session, objectGroup: string): Promise<number> => {
  const rules = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `

function getSheetRules(sheet){
  const allRules = []
  const rules = Array.from(sheet.cssRules || sheet.rules || []);
  for(const rule of rules){
    allRules.push(rule.cssText)
  }
  // Also count nested rules (like those inside @media queries)
  for(const rule of rules){
    if (rule.cssRules) {
      const nested = Array.from(rule.cssRules);
      for(const item of nested){
        allRules.push(item.cssText)
      }
    }
  };
  return allRules
}

function getCSSRules() {
  const allRules = [];
  const styleSheets = Array.from(document.styleSheets);
  for (const sheet of styleSheets) {
      try {
          allRules.push(...getSheetRules(sheet));
      } catch (e) {
          // CORS might prevent accessing rules from external stylesheets
          console.warn('Could not read rules from stylesheet:', e);
      }
  }

  return allRules;
}

;(getCSSRules())`,
    returnByValue: true,
    objectGroup,
  })
  return rules
}
