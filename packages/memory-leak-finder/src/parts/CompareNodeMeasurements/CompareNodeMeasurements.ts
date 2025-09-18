import * as CompareNamedFunctionCount3 from '../CompareNamedFunctionCount3/CompareNamedFunctionCount3.ts'
import * as WriteNodeResult from '../WriteNodeResult/WriteNodeResult.ts'

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

        // Compare the measurements
        const result = await CompareNamedFunctionCount3.compareNamedFunctionCount3(
          beforeData,
          afterData,
          context,
        )

        // Write the result to file
        await WriteNodeResult.writeNodeResult(
          beforeMeasurement.nodeProcessId,
          measure,
          testName,
          result,
        )

        console.log(`Node process ${beforeMeasurement.nodeProcessId} comparison completed`)
      } catch (error) {
        console.error(`Failed to compare node process ${beforeMeasurement.nodeProcessId}:`, error)
      }
    }
  }
}
