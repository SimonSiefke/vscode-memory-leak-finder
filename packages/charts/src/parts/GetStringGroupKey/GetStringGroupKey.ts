export interface LocatedString {
  readonly string: string | null
  readonly location: string | null
  readonly count: number
  readonly heapObjectId?: string
  readonly stringType?: string
  readonly stackCounts?: readonly { readonly stack: string; readonly count: number }[]
  readonly stack?: string
  readonly locationKind?: 'stack-frame'
}

// Numeric path segments are commonly instance IDs. Keep digits in names,
// versions, stack line/column positions, and the retaining location intact.
export const getStringPattern = (value: string): string => value.replace(/(?<=\/)\d+(?=\/|[?#]|$)/g, '\\d+')

export const getGroupKey = (group: LocatedString): string => {
  if (group.stack) return JSON.stringify(['stack', group.stack, group.location, group.locationKind ?? null])
  const pattern = group.string === null ? null : getStringPattern(group.string)
  return JSON.stringify([pattern, pattern !== group.string, group.location, group.heapObjectId ?? null, group.locationKind ?? null])
}
