import * as LaunchFunctionTrackerWorker from './LaunchFunctionTrackerWorker.ts'

export const launchFunctionTrackerAndPreGenerateWorkbench = async (
  binaryPath: string,
  preGeneratedWorkbenchPath: string | null,
): Promise<void> => {
  const functionTrackerRpc = await LaunchFunctionTrackerWorker.launchFunctionTrackerWorker()
  try {
    // Pre-generate workbench.desktop.main.js to avoid memory issues
    console.log(`[Launch] Pre-generating workbench.desktop.main.js from ${binaryPath} to ${preGeneratedWorkbenchPath}`)
    await functionTrackerRpc.invoke('FunctionTracker.preGenerateWorkbench', binaryPath, preGeneratedWorkbenchPath)
    console.log(`[Launch] Successfully pre-generated workbench.desktop.main.js`)
  } finally {
    // Dispose the function tracker worker after generating the workbench file
    await functionTrackerRpc[Symbol.asyncDispose]()
  }
}
