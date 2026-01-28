import * as ParseSpecialSelectorBody from '../ParseSpecialSelectorBody/ParseSpecialSelectorBody.ts'
import * as SpecialSelectorPrefix from '../SpecialSelectorPrefix/SpecialSelectorPrefix.ts'

export const querySelectorAll = (roots: readonly Element[], body: string, selector: string): Element[] => {
  const nth = ParseSpecialSelectorBody.parseInt(body, SpecialSelectorPrefix.Nth)
  if (nth >= roots.length) {
    return []
  }
  return [roots[nth]]
}
