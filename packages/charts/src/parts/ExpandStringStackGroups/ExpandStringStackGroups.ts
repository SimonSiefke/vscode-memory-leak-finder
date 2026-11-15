import type { LocatedString } from '../GetStringGroupKey/GetStringGroupKey.ts'

export const expandStringStackGroups = (group: LocatedString): readonly LocatedString[] => {
  const counts = new Map<string, number>()
  for (const { stack, count } of group.stackCounts ?? []) {
    if (!stack || !Number.isSafeInteger(count) || count <= 0) return [group]
    counts.set(stack, (counts.get(stack) ?? 0) + count)
  }
  const attributedCount = [...counts.values()].reduce((sum, count) => sum + count, 0)
  if (!counts.size || attributedCount > group.count) return [group]
  return [
    ...[...counts].map(([stack, count]) => ({ ...group, stack, count })),
    ...(attributedCount < group.count ? [{ ...group, count: group.count - attributedCount }] : []),
  ]
}
