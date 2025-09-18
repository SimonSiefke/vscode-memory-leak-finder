import * as MemoryLeakWorker from '../MemoryLeakWorker/MemoryLeakWorker.ts'

export interface NodeProcessMeasurement {
  readonly nodeProcessId: string
  readonly before: string
  readonly after: string
  readonly result: any
}

export const compareNodeMeasurements = async (
  beforeMeasurements: readonly NodeProcessMeasurement[],
  afterMeasurements: readonly NodeProcessMeasurement[],
  measure: string,
  testName: string,
  context: any,
): Promise<void> => {
  const memoryLeakWorkerRpc = MemoryLeakWorker.getRpc()
  if (!memoryLeakWorkerRpc) {
    console.error('Memory leak worker RPC not available')
    return
  }

  // Create a map of after measurements by node process ID
  const afterMap = new Map<string, NodeProcessMeasurement>()
  for (const measurement of afterMeasurements) {
    afterMap.set(measurement.nodeProcessId, measurement)
  }

  // Compare each before measurement with its corresponding after measurement
  for (const beforeMeasurement of beforeMeasurements) {
    const afterMeasurement = afterMap.get(beforeMeasurement.nodeProcessId)
    if (afterMeasurement) {
      try {
        // Parse the JSON data
        const beforeData = JSON.parse(beforeMeasurement.before)
        const afterData = JSON.parse(afterMeasurement.after)

        // Compare the measurements using the memory leak worker
        const result = await memoryLeakWorkerRpc.invoke('CompareNamedFunctionCount3.compareNamedFunctionCount3', beforeData, afterData, context)

        // Write the result to file using the memory leak worker
        await memoryLeakWorkerRpc.invoke('WriteNodeResult.writeNodeResult', beforeMeasurement.nodeProcessId, measure, testName, result)

        console.log(`Node process ${beforeMeasurement.nodeProcessId} comparison completed`)
      } catch (error) {
        console.error(`Failed to compare node process ${beforeMeasurement.nodeProcessId}:`, error)
      }
    }
  }
}