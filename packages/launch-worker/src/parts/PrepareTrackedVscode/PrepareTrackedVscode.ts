import * as LaunchFunctionTrackerWorker from '../LaunchFunctionTrackerWorker/LaunchFunctionTrackerWorker.ts'

export const prepareTrackedVscode = async (binaryPath: string, trackingMode: string): Promise<string> => {
  await using rpc = await LaunchFunctionTrackerWorker.launchFunctionTrackerWorker()
  return rpc.invoke('FunctionTracker.getPreparedVscodePath', binaryPath, trackingMode) as Promise<string>
}
