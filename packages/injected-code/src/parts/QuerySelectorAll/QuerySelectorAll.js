import * as QuerySelectorAllByCss from '../QuerySelectorAllByCss/QuerySelectorAllByCss.js'
import * as QuerySelectorAllByText from '../QuerySelectorAllByText/QuerySelectorAllByText.js'
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
    default:
      throw new Error('not found')
  }
}
