import * as LaunchFunctionTrackerWorker from './LaunchFunctionTrackerWorker.ts'

export const launchFunctionTrackerAndPreGenerateWorkbench = async (
  binaryPath: string,
  preGeneratedWorkbenchPath: string | null,
  trackingMode = 'functions',
): Promise<void> => {
  await using functionTrackerRpc = await LaunchFunctionTrackerWorker.launchFunctionTrackerWorker()
  console.log(`[Launch] Pre-generating workbench.desktop.main.js from ${binaryPath} to ${preGeneratedWorkbenchPath}`)
  await functionTrackerRpc.invoke('FunctionTracker.preGenerateWorkbench', binaryPath, preGeneratedWorkbenchPath, trackingMode)
  console.log(`[Launch] Successfully pre-generated workbench.desktop.main.js`)
}
