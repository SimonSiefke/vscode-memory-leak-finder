import * as Character from '../Character/Character.js'
import * as SpecialSelectorPrefix from '../SpecialSelectorPrefix/SpecialSelectorPrefix.js'

const specialSelectors = Object.values(SpecialSelectorPrefix)

export const parseSpecialSelector = (selector, i) => {
  const part = selector.slice(i)
  for (const specialSelector of specialSelectors) {
    if (part.startsWith(specialSelector)) {
      return specialSelector
    }
  }
  return Character.EmptyString
}
