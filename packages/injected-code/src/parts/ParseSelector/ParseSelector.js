import * as Assert from '../Assert/Assert.js'
import * as Character from '../Character/Character.js'
import * as GetSpecialSelectorBody from '../GetSpecialSelectorBody/GetSpecialSelectorBody.js'
import * as GetSpecialSelectorType from '../GetSpecialSelectorType/GetSpecialSelectorType.js'
import * as ParseSpecialSelector from '../ParseSpecialSelector/ParseSpecialSelector.js'
import * as SelectorType from '../SelectorType/SelectorType.js'

export const parseSelector = (selector) => {
  Assert.string(selector)
  if (selector.startsWith('text=')) {
    const text = selector.slice('text='.length)
    return [
      {
        type: SelectorType.Text,
        body: `:has-text("${text}")`,
      },
    ]
  }
  const parts = []
  let start = 0
  const length = selector.length
  for (let i = 0; i < length; i++) {
    // TODO use indexof colon for faster search
    const char = selector[i]
    if (char === Character.Colon) {
      const specialSelector = ParseSpecialSelector.parseSpecialSelector(selector, i)
      if (specialSelector) {
        if (i > start) {
          parts.push({
            type: SelectorType.Css,
            body: selector.slice(start, i),
          })
        }
        const type = GetSpecialSelectorType.getSpecialSelectorType(specialSelector)
        const body = GetSpecialSelectorBody.getSpecialSelectorBody(selector, i, specialSelector)
        i += specialSelector.length + body.length
        parts.push({
          type,
          body,
        })
        start = i
      }
    }
  }
  if (start < length) {
    parts.push({
      type: SelectorType.Css,
      body: selector.slice(start, length),
    })
  }
  return parts
}
