import * as TargetId from '../TargetId/TargetId.ts'

export type MeasureTarget = readonly (1 | 2 | 3)[]

const ALL_TARGETS: MeasureTarget = [TargetId.Browser, TargetId.Node, TargetId.Worker]
const BROWSER_ONLY: MeasureTarget = [TargetId.Browser]
const BROWSER_AND_WORKER: MeasureTarget = [TargetId.Browser, TargetId.Worker]

export const getDefaultTarget = (measureId: string): MeasureTarget => {
  const id = measureId.toLowerCase()

  // Obvious DOM-related measures → browser only
  if (
    id.includes('dom') ||
    id.includes('css') ||
    id.includes('styleelement') ||
    id.includes('iframe') ||
    id.includes('mediaquery') ||
    id.includes('eventlistener') ||
    id.includes('eventtarget') ||
    id.includes('detacheddom') ||
    id.includes('attacheddom') ||
    id.includes('minimap') ||
    id.includes('widget') ||
    id.includes('resizeobserver') ||
    id.includes('intersectionobserver') ||
    id.includes('mutationobserver')
  ) {
    return BROWSER_ONLY
  }

  // Offscreen canvas is available in window and worker contexts
  if (id.includes('offscreencanvas')) {
    return BROWSER_AND_WORKER
  }

  // MessagePort exists in window and worker contexts
  if (id.includes('messageport')) {
    return BROWSER_AND_WORKER
  }

  return ALL_TARGETS
}
