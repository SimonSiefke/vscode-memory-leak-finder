import * as LaunchFunctionTrackerWorker from './LaunchFunctionTrackerWorker.ts'

let functionTrackerRpc: Awaited<ReturnType<typeof LaunchFunctionTrackerWorker.launchFunctionTrackerWorker>> | undefined

const getFunctionTrackerRpc = async (): Promise<Awaited<ReturnType<typeof LaunchFunctionTrackerWorker.launchFunctionTrackerWorker>>> => {
  if (!functionTrackerRpc) {
    functionTrackerRpc = await LaunchFunctionTrackerWorker.launchFunctionTrackerWorker()
  }
  return functionTrackerRpc
}

export const launchFunctionTrackerAndPreGenerateWorkbench = async (
  binaryPath: string,
  preGeneratedWorkbenchPath: string | null,
  port: number,
  trackingMode = 'functions',
): Promise<void> => {
  const functionTrackerRpc = await getFunctionTrackerRpc()
  await functionTrackerRpc.invoke('FunctionTracker.startServer', port)
  console.log(`[Launch] Pre-generating workbench.desktop.main.js from ${binaryPath} to ${preGeneratedWorkbenchPath}`)
  await functionTrackerRpc.invoke('FunctionTracker.preGenerateWorkbench', binaryPath, preGeneratedWorkbenchPath, trackingMode)
  console.log(`[Launch] Successfully pre-generated workbench.desktop.main.js`)
}
