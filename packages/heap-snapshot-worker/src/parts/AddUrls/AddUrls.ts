import type { LeakedClosureWithReferences } from '../EnrichLeakedClosuresWithReferences/LeakedClosureWithReferences.ts'
import { convertLocationKeyToUrl } from '../ConvertLocationKeyToUrl/ConvertLocationKeyToUrl.ts'

export const addUrls = (
  enriched: Record<string, readonly LeakedClosureWithReferences[]>,
  scriptMap: Record<number, { readonly url?: string; readonly sourceMapUrl?: string }>,
): Record<string, readonly LeakedClosureWithReferences[]> => {
  const result: Record<string, readonly LeakedClosureWithReferences[]> = {}
  for (const [locationKey, closures] of Object.entries(enriched)) {
    const urlKey = convertLocationKeyToUrl(locationKey, scriptMap || {})
    result[urlKey] = closures
  }
  return result
}
