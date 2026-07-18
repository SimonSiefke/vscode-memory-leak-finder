import { basename, dirname, extname, join } from 'node:path'
import { mkdir, rename, rm } from 'node:fs/promises'
import type { Session } from '../Session/Session.ts'
import type { ScriptMap } from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import * as ResolveTrackedLocationSourceMaps from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import type {
  TrackedEverythingMetadata,
  TrackedEverythingSite,
} from '../GetTrackedEverything/GetTrackedEverything.ts'

export interface TrackedEverythingAfter {
  readonly metadata: TrackedEverythingMetadata
  readonly scriptMap: ScriptMap
  readonly temporaryEventPath: string
}

export interface TrackedEverythingResultSite extends TrackedEverythingSite {
  readonly originalColumn: number | null
  readonly originalLine: number | null
  readonly originalLocation: string | null
  readonly originalSource: string | null
}

export interface TrackedEverythingResult {
  readonly durationMs: number
  readonly eventCount: number
  readonly eventFile: string
  readonly schemaVersion: 1
  readonly sites: readonly TrackedEverythingResultSite[]
  readonly timeMarks: TrackedEverythingMetadata['timeMarks']
}

const getEventPath = (resultPath: string): string => {
  const extension = extname(resultPath)
  const stem = extension ? basename(resultPath, extension) : basename(resultPath)
  return join(dirname(resultPath), `${stem}.events.bin`)
}

export const compareTrackedEverything = async (
  _before: unknown,
  after: TrackedEverythingAfter,
  context: Session & { readonly resultPath?: string },
): Promise<TrackedEverythingResult> => {
  if (!context.resultPath) {
    throw new Error(`Tracked everything measure requires resultPath in compare context`)
  }
  const locations = after.metadata.sites.map((site) => site.location)
  const resolved = await ResolveTrackedLocationSourceMaps.resolveTrackedLocationSourceMaps(locations, after.scriptMap)
  const sites = after.metadata.sites.map((site) => {
    const original = resolved[site.location]
    return {
      ...site,
      originalColumn: original?.originalColumn ?? null,
      originalLine: original?.originalLine ?? null,
      originalLocation: original?.originalLocation ?? null,
      originalSource: original?.originalSource ?? null,
    }
  })
  const eventPath = getEventPath(context.resultPath)
  await mkdir(dirname(eventPath), { recursive: true })
  await rm(eventPath, { force: true })
  await rename(after.temporaryEventPath, eventPath)
  return {
    durationMs: after.metadata.durationMs,
    eventCount: after.metadata.eventCount,
    eventFile: basename(eventPath),
    schemaVersion: 1,
    sites,
    timeMarks: after.metadata.timeMarks,
  }
}
