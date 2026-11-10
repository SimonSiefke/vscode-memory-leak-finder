import { getGroupKey, type LocatedString } from '../GetStringGroupKey/GetStringGroupKey.ts'

export const getStackLabels = (groups: readonly LocatedString[]): ReadonlyMap<string, string> => {
  const families = new Map<string, Map<string, LocatedString>>()
  for (const group of groups) {
    if (!group.stack) continue
    const family = JSON.stringify([group.location, group.locationKind ?? null])
    let stacks = families.get(family)
    if (!stacks) {
      stacks = new Map()
      families.set(family, stacks)
    }
    stacks.set(group.stack, group)
  }
  const labels = new Map<string, string>()
  for (const stacks of families.values()) {
    const entries = [...stacks].map(([stack, group]) => ({
      group,
      frames: stack
        .split(/\r?\n|\\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('at ')),
    }))
    let frame = 0
    if (entries.length > 1) {
      while (entries[0].frames[frame] && entries.every((entry) => entry.frames[frame] === entries[0].frames[frame])) frame++
    }
    for (const entry of entries) {
      const sameFrames = entries.length > 1 && entries.every((candidate) => candidate.frames.length === frame)
      const summary = sameFrames
        ? `${entry.group.stack!.split(/\r?\n|\\n/)[0]}: ${entry.frames.at(-1) ?? 'Error stack'}`
        : (entry.frames[frame] ?? `${entry.frames.at(-1) ?? 'Error stack'} (stack ends here)`)
      labels.set(getGroupKey(entry.group), `Stack: ${summary}`)
    }
  }
  return labels
}
