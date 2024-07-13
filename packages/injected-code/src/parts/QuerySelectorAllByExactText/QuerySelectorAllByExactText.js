import * as Assert from '../Assert/Assert.js'
import * as ParseSpecialSelectorBody from '../ParseSpecialSelectorBody/ParseSpecialSelectorBody.js'
import * as SpecialSelectorPrefix from '../SpecialSelectorPrefix/SpecialSelectorPrefix.js'

export const querySelectorAll = (roots, body) => {
  Assert.array(roots)
  Assert.string(body)
  const text = ParseSpecialSelectorBody.parseString(body, SpecialSelectorPrefix.HasExactText)
  const matches = []
  for (const element of roots) {
    if (element.textContent === text) {
      matches.push(element)
    }
  }
  return matches
}
