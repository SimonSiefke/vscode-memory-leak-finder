import * as QuerySelectorAllByCss from '../QuerySelectorAllByCss/QuerySelectorAllByCss.ts'
import * as QuerySelectorAllByExactText from '../QuerySelectorAllByExactText/QuerySelectorAllByExactText.ts'
import * as QuerySelectorAllByText from '../QuerySelectorAllByText/QuerySelectorAllByText.ts'
import * as QuerySelectorAllEnterShadow from '../QuerySelectorAllEnterShadow/QuerySelectorAllEnterShadow.ts'
import * as QuerySelectorAllInternalEnterFrame from '../QuerySelectorAllInternalEnterFrame/QuerySelectorAllInternalEnterFrame.ts'
import * as QuerySelectorAllNth from '../QuerySelectorAllNth/QuerySelectorAllNth.ts'
import * as SelectorType from '../SelectorType/SelectorType.ts'

export const getSelectorModule = (type: string | number): { querySelectorAll: (roots: readonly Element[], body: string, selector: string) => Element[] } => {
  const typeNumber = typeof type === 'string' ? Number.parseInt(type, 10) : type
  switch (typeNumber) {
    case SelectorType.Css:
      return QuerySelectorAllByCss as { querySelectorAll: (roots: readonly Element[], body: string, selector: string) => Element[] }
    case SelectorType.EnterShadow:
      return QuerySelectorAllEnterShadow as { querySelectorAll: (roots: readonly Element[], body: string, selector: string) => Element[] }
    case SelectorType.ExactText:
      return QuerySelectorAllByExactText as { querySelectorAll: (roots: readonly Element[], body: string, selector: string) => Element[] }
    case SelectorType.InternalEnterFrame:
      return QuerySelectorAllInternalEnterFrame as { querySelectorAll: (roots: readonly Element[], body: string, selector: string) => Element[] }
    case SelectorType.Nth:
      return QuerySelectorAllNth as { querySelectorAll: (roots: readonly Element[], body: string, selector: string) => Element[] }
    case SelectorType.Text:
      return QuerySelectorAllByText as { querySelectorAll: (roots: readonly Element[], body: string, selector: string) => Element[] }
    default:
      throw new Error('not found')
  }
}
