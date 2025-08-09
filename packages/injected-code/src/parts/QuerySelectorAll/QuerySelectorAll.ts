import * as QuerySelectorAllByCss from '../QuerySelectorAllByCss/QuerySelectorAllByCss.ts'
import * as QuerySelectorAllByExactText from '../QuerySelectorAllByExactText/QuerySelectorAllByExactText.ts'
import * as QuerySelectorAllByText from '../QuerySelectorAllByText/QuerySelectorAllByText.ts'
import * as QuerySelectorAllEnterShadow from '../QuerySelectorAllEnterShadow/QuerySelectorAllEnterShadow.ts'
import * as QuerySelectorAllInternalEnterFrame from '../QuerySelectorAllInternalEnterFrame/QuerySelectorAllInternalEnterFrame.ts'
import * as QuerySelectorAllNth from '../QuerySelectorAllNth/QuerySelectorAllNth.ts'
import * as SelectorType from '../SelectorType/SelectorType.ts'

export const getSelectorModule = (type) => {
  switch (type) {
    case SelectorType.Css:
      return QuerySelectorAllByCss
    case SelectorType.Text:
      return QuerySelectorAllByText
    case SelectorType.Nth:
      return QuerySelectorAllNth
    case SelectorType.InternalEnterFrame:
      return QuerySelectorAllInternalEnterFrame
    case SelectorType.EnterShadow:
      return QuerySelectorAllEnterShadow
    case SelectorType.ExactText:
      return QuerySelectorAllByExactText
    default:
      throw new Error('not found')
  }
}
