import * as Assert from '../Assert/Assert.ts'
import * as ParseSpecialSelectorBody from '../ParseSpecialSelectorBody/ParseSpecialSelectorBody.ts'
import * as SpecialSelectorPrefix from '../SpecialSelectorPrefix/SpecialSelectorPrefix.ts'

export const querySelectorAll = (roots: any[], body: string): any[] => {
  Assert.array(roots)
  Assert.string(body)
  const text = ParseSpecialSelectorBody.parseString(body, SpecialSelectorPrefix.HasExactText)
  const matches: any[] = []
  for (const element of roots) {
    if (element.textContent === text) {
      matches.push(element)
    }
  }
  return matches
}
