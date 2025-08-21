import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'
import { ExpectError } from '../ExpectError/ExpectError.ts'

/**
 * @param {string} expectedTitle
 */
export const toHaveTitle = async (expectedTitle) => {
  const title = await EvaluateInUtilityContext.evaluateInUtilityContext({
    expression: `document.title`,
  })
  if (title !== expectedTitle) {
    throw new ExpectError(`expected page to have title ${expectedTitle} but was ${title}`)
  }
}
