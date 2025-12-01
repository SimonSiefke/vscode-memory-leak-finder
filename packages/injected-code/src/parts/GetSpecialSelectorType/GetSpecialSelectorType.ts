import * as SelectorType from '../SelectorType/SelectorType.ts'
import * as SpecialSelectorPrefix from '../SpecialSelectorPrefix/SpecialSelectorPrefix.ts'

export const getSpecialSelectorType = (specialSelector) => {
  switch (specialSelector) {
    case SpecialSelectorPrefix.HasText:
      return SelectorType.Text
    case SpecialSelectorPrefix.Nth:
      return SelectorType.Nth
    case SpecialSelectorPrefix.InternalEnterFrame:
      return SelectorType.InternalEnterFrame
    case SpecialSelectorPrefix.EnterShadow:
      return SelectorType.EnterShadow
    case SpecialSelectorPrefix.HasExactText:
      return SelectorType.ExactText
    default:
      return SelectorType.None
  }
}
