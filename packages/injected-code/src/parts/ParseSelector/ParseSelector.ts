import * as Assert from '../Assert/Assert.ts'
import * as Character from '../Character/Character.ts'
import * as GetSpecialSelectorBody from '../GetSpecialSelectorBody/GetSpecialSelectorBody.ts'
import * as GetSpecialSelectorType from '../GetSpecialSelectorType/GetSpecialSelectorType.ts'
import * as ParseSpecialSelector from '../ParseSpecialSelector/ParseSpecialSelector.ts'
import * as SelectorType from '../SelectorType/SelectorType.ts'

export const parseSelector = (selector: string): any[] => {
  Assert.string(selector)
  // TODO remove support for text=
  // use :has-text instead
  if (selector.startsWith('text=')) {
    const text = selector.slice('text='.length)
    return [
      {
        body: `:has-text("${text}")`,
        type: SelectorType.Text,
      },
    ]
  }
  const parts: any[] = []
  let start = 0
  const { length } = selector
  for (let i = 0; i < length; i++) {
    // TODO use indexof colon for faster search
    const char = selector[i]
    if (char === Character.Colon) {
      const specialSelector = ParseSpecialSelector.parseSpecialSelector(selector, i)
      if (specialSelector) {
        if (i > start) {
          parts.push({
            body: selector.slice(start, i),
            type: SelectorType.Css,
          })
        }
        const type = GetSpecialSelectorType.getSpecialSelectorType(specialSelector)
        const body = GetSpecialSelectorBody.getSpecialSelectorBody(selector, i, specialSelector)
        i += body.length
        parts.push({
          body,
          type,
        })
        start = i
        i--
      }
    }
  }
  if (start < length) {
    parts.push({
      body: selector.slice(start, length),
      type: SelectorType.Css,
    })
  }
  return parts
}
