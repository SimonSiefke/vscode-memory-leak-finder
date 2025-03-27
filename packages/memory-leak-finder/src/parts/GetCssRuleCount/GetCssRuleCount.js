import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getCssRuleCount = async (session, objectGroup) => {
  const ruleCount = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `

function getSheetRules(sheet){
  let total = 0
  const rules = Array.from(sheet.cssRules || sheet.rules || []);
  total += rules.length;
  // Also count nested rules (like those inside @media queries)
  rules.forEach(rule => {
    if (rule.cssRules) {
      total += Array.from(rule.cssRules).length;
    }
  });
  return total
}

function getCSSRuleCount() {
  let totalRules = 0;
  const styleSheets = Array.from(document.styleSheets);
  for (const sheet of styleSheets) {
      try {
          totalRules += getSheetRules(sheet);
      } catch (e) {
          // CORS might prevent accessing rules from external stylesheets
          console.warn('Could not read rules from stylesheet:', e);
      }
  }

  return totalRules;
}

;(getCSSRuleCount())`,
    returnByValue: true,
    objectGroup,
  })
  return ruleCount
}
