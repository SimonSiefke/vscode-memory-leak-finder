import type { ScriptMap } from '../Types/Types.ts'
import * as ResolveTrackedLocationSourceMaps from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'

interface SourceLocation {
  readonly column: number
  readonly line: number
  readonly name?: string
  readonly scriptId?: number
  readonly source: string
}

interface StackFrame {
  readonly functionName: string
  readonly generated?: SourceLocation
  readonly original?: SourceLocation
}

interface Evidence {
  readonly allocationStack: readonly StackFrame[]
  readonly leakedObject: string
  readonly leakedObjectStack: readonly StackFrame[]
  readonly path: readonly unknown[]
  readonly retainingLocation?: SourceLocation
  readonly retainingProperty: string
}

interface RiverLink {
  readonly evidence: readonly Evidence[]
}

interface RiverReport {
  readonly links: readonly RiverLink[]
}

const getLocationKey = (location: SourceLocation): string => {
  const source = location.scriptId === undefined ? location.source : String(location.scriptId)
  return `${source}:${location.line + 1}:${location.column + 1}`
}

const resolveLocation = (
  generated: SourceLocation,
  locations: Readonly<Record<string, ResolveTrackedLocationSourceMaps.ResolvedTrackedLocation>>,
): SourceLocation | undefined => {
  const resolved = locations[getLocationKey(generated)]
  if (!resolved?.originalSource || resolved.originalLine === null || resolved.originalColumn === null) {
    return undefined
  }
  return {
    column: resolved.originalColumn,
    line: resolved.originalLine - 1,
    ...(resolved.originalName ? { name: resolved.originalName } : {}),
    source: resolved.originalSource,
  }
}

const resolveStack = (
  stack: readonly StackFrame[],
  locations: Readonly<Record<string, ResolveTrackedLocationSourceMaps.ResolvedTrackedLocation>>,
): readonly StackFrame[] => {
  return stack.map((frame) => {
    if (!frame.generated) {
      return frame
    }
    const original = resolveLocation(frame.generated, locations)
    return {
      ...frame,
      ...(original ? { original } : {}),
    }
  })
}

export const resolveRetainerRiverSourceMaps = async <T extends RiverReport>(report: T, scriptMap: ScriptMap): Promise<T> => {
  const generatedLocations: SourceLocation[] = []
  for (const link of report.links) {
    for (const evidence of link.evidence) {
      for (const frame of [...evidence.allocationStack, ...evidence.leakedObjectStack]) {
        if (frame.generated) {
          generatedLocations.push(frame.generated)
        }
      }
    }
  }
  const keys = [...new Set(generatedLocations.map(getLocationKey))]
  if (keys.length === 0) {
    return report
  }
  const locations = await ResolveTrackedLocationSourceMaps.resolveTrackedLocationSourceMaps(keys, scriptMap)
  return {
    ...report,
    links: report.links.map((link) => ({
      ...link,
      evidence: link.evidence.map((evidence) => {
        const allocationStack = resolveStack(evidence.allocationStack, locations)
        const leakedObjectStack = resolveStack(evidence.leakedObjectStack, locations)
        const retainingLocation = allocationStack[0]?.original || allocationStack[0]?.generated || evidence.retainingLocation
        return {
          ...evidence,
          allocationStack,
          leakedObjectStack,
          ...(retainingLocation ? { retainingLocation } : {}),
        }
      }),
    })),
  }
}
