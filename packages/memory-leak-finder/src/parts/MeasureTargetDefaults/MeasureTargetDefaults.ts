export type MeasureTarget = readonly ('browser' | 'node' | 'webworker')[]

const ALL_TARGETS: MeasureTarget = ['browser', 'node', 'webworker']
const BROWSER_ONLY: MeasureTarget = ['browser']
const BROWSER_AND_WORKER: MeasureTarget = ['browser', 'webworker']

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
