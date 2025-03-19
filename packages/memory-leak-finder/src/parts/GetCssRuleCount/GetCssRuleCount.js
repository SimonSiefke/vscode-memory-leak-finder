import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetObjectCount from '../GetObjectCount/GetObjectCount.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getCssRuleCount = async (session, objectGroup) => {
  const ruleCount = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `function getCSSRuleCount() {
    let totalRules = 0;

    // Get all stylesheets in the document
    const styleSheets = Array.from(document.styleSheets);

    for (const sheet of styleSheets) {
        try {
            // Get all CSS rules in this stylesheet
            const rules = Array.from(sheet.cssRules || sheet.rules || []);
            totalRules += rules.length;

            // Also count nested rules (like those inside @media queries)
            rules.forEach(rule => {
                if (rule.cssRules) {
                    totalRules += Array.from(rule.cssRules).length;
                }
            });
        } catch (e) {
            // CORS might prevent accessing rules from external stylesheets
            console.warn('Could not read rules from stylesheet:', e);
        }
    }

    return totalRules;
}

// You could also get more detailed metrics:
function getCSSMetrics() {
    const metrics = {
        totalRules: 0,
        styleSheetCount: 0,
        mediaQueryCount: 0,
        keyframesCount: 0,
        importCount: 0,
        inlineStyles: 0
    };

    // Count inline styles
    metrics.inlineStyles = document.querySelectorAll('[style]').length;

    // Get all stylesheets
    const styleSheets = Array.from(document.styleSheets);
    metrics.styleSheetCount = styleSheets.length;

    for (const sheet of styleSheets) {
        try {
            const rules = Array.from(sheet.cssRules || sheet.rules || []);

            rules.forEach(rule => {
                metrics.totalRules++;

                // Count specific rule types
                if (rule instanceof CSSMediaRule) {
                    metrics.mediaQueryCount++;
                } else if (rule instanceof CSSKeyframesRule) {
                    metrics.keyframesCount++;
                } else if (rule instanceof CSSImportRule) {
                    metrics.importCount++;
                }
            });
        } catch (e) {
            console.warn('Could not read rules from stylesheet:', e);
        }
    }

    return metrics;
}

;(getCSSRuleCount())`,
    returnByValue: true,
    objectGroup,
  })
  return ruleCount
}
