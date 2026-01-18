import * as SelectorType from '../SelectorType/SelectorType.ts'
import * as SpecialSelectorPrefix from '../SpecialSelectorPrefix/SpecialSelectorPrefix.ts'

export const getSpecialSelectorType = (specialSelector: string) => {
  switch (specialSelector) {
    case SpecialSelectorPrefix.EnterShadow:
      return SelectorType.EnterShadow
    case SpecialSelectorPrefix.HasExactText:
      return SelectorType.ExactText
    case SpecialSelectorPrefix.HasText:
      return SelectorType.Text
    case SpecialSelectorPrefix.InternalEnterFrame:
      return SelectorType.InternalEnterFrame
    case SpecialSelectorPrefix.Nth:
      return SelectorType.Nth
    default:
      return SelectorType.None
  }
}
