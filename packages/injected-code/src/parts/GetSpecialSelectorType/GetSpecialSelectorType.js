import * as SelectorType from '../SelectorType/SelectorType.js'
import * as SpecialSelectorPrefix from '../SpecialSelectorPrefix/SpecialSelectorPrefix.js'

export const getSpecialSelectorType = (specialSelector) => {
  switch (specialSelector) {
    case SpecialSelectorPrefix.HasText:
      return SelectorType.Text
    case SpecialSelectorPrefix.Nth:
      return SelectorType.Nth
    default:
      return SelectorType.None
  }
}
