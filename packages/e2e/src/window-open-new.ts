import type { TestContext } from '../types.ts'

export const skip = true

export const requiresNetwork = true

const getFrontendStartupPerformanceSample = `(() => {
  const getEntryStartTime = (entryName, entryType) => {
    const entries = performance.getEntriesByType(entryType)
    const entry = entries.find((entry) => entry.name === entryName)
    return entry && typeof entry.startTime === 'number' ? entry.startTime : undefined
  }
  const didLoadWorkbenchMain = getEntryStartTime('code/didLoadWorkbenchMain', 'mark')
  const didStartWorkbench = getEntryStartTime('code/didStartWorkbench', 'mark')
  const workbenchStartup =
    typeof didLoadWorkbenchMain === 'number' && typeof didStartWorkbench === 'number'
      ? didStartWorkbench - didLoadWorkbenchMain
      : undefined
  const workbenchCreateAndRestore = performance
    .getEntriesByType('measure')
    .find((entry) => entry.name === 'perf: workbench create & restore')
  const navigationEntry = performance.getEntriesByType('navigation')[0]
  const navigation = navigationEntry ? navigationEntry.toJSON() : {}
  const paintEntries = performance.getEntriesByType('paint')
  const sample = {
    domContentLoadedEventEnd: navigation.domContentLoadedEventEnd,
    domContentLoadedEventStart: navigation.domContentLoadedEventStart,
    domInteractive: navigation.domInteractive,
    duration: navigation.duration,
    loadEventEnd: navigation.loadEventEnd,
    loadEventStart: navigation.loadEventStart,
    responseEnd: navigation.responseEnd,
    timestamp: Date.now(),
    url: location.href,
    workbenchCreateAndRestore: workbenchCreateAndRestore ? workbenchCreateAndRestore.duration : undefined,
    workbenchStartup,
  }
  for (const entry of paintEntries) {
    sample[entry.name] = entry.startTime
  }
  return sample
})()`

const appendFrontendStartupPerformanceSample = (sample: unknown): string => `(() => {
  const samples = globalThis.__vscodeMemoryLeakFinderFrontendStartupPerformance
  if (!Array.isArray(samples)) {
    return false
  }
  const sample = ${JSON.stringify(sample)}
  sample.runIndex = samples.length
  samples.push(sample)
  return true
})()`

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  const newWindow = await Workbench.openNewWindow()
  await newWindow.shouldBeVisible()
  const sample = await newWindow.evaluate({
    expression: getFrontendStartupPerformanceSample,
    returnByValue: true,
  })
  await Workbench.evaluate({
    expression: appendFrontendStartupPerformanceSample(sample),
    returnByValue: true,
  })
  // @ts-ignore
  await newWindow.closeGracefully()
}
