import * as ParseSpecialSelectorBody from '../ParseSpecialSelectorBody/ParseSpecialSelectorBody.js'
import * as SpecialSelectorPrefix from '../SpecialSelectorPrefix/SpecialSelectorPrefix.js'

export const querySelectorAll = (roots, body, selector) => {
  const nth = ParseSpecialSelectorBody.parseInt(body, SpecialSelectorPrefix.Nth)
  if (nth >= roots.length) {
    return []
  }
  return [roots[nth]]
}
