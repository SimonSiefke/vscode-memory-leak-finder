import * as QuerySelectorAllByCss from '../QuerySelectorAllByCss/QuerySelectorAllByCss.js'
import * as QuerySelectorAllByText from '../QuerySelectorAllByText/QuerySelectorAllByText.js'
import * as QuerySelectorAllEnterShadow from '../QuerySelectorAllEnterShadow/QuerySelectorAllEnterShadow.js'
import * as QuerySelectorAllInternalEnterFrame from '../QuerySelectorAllInternalEnterFrame/QuerySelectorAllInternalEnterFrame.js'
import * as QuerySelectorAllNth from '../QuerySelectorAllNth/QuerySelectorAllNth.js'
import * as SelectorType from '../SelectorType/SelectorType.js'

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
    default:
      throw new Error('not found')
  }
}
