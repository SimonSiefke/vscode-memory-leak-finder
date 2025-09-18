import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import * as GetNodeProcesses from '../GetNodeProcesses/GetNodeProcesses.ts'
import * as GetNodeNamedFunctionCount3 from '../GetNodeNamedFunctionCount3/GetNodeNamedFunctionCount3.ts'
import * as WriteNodeResult from '../WriteNodeResult/WriteNodeResult.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as CompareNamedFunctionCount3 from '../CompareNamedFunctionCount3/CompareNamedFunctionCount3.ts'
import * as Root from '../Root/Root.ts'

export interface NodeProcessMeasurement {
  readonly nodeProcessId: string
  readonly before: string
  readonly after: string
  readonly result: any
}

export const measureNodeProcesses = async (
  browserSession: Session,
  measure: string,
  testName: string,
  phase: 'before' | 'after',
): Promise<readonly NodeProcessMeasurement[]> => {
  const nodeProcesses = await GetNodeProcesses.getNodeProcesses(browserSession)
  const measurements: NodeProcessMeasurement[] = []
  
  for (const nodeProcess of nodeProcesses) {
    try {
      // Create script handler for this Node process
      const objectGroup = ObjectGroupId.create()
      const scriptHandler = ScriptHandler.create()
      
      // Start script handler
      await scriptHandler.start(nodeProcess.session)
      
      // Capture snapshot
      const snapshot = await GetNodeNamedFunctionCount3.getNodeNamedFunctionCount3(
        nodeProcess.session,
        nodeProcess.targetId,
        scriptHandler.scriptMap,
        false,
        phase,
      )
      
      // Stop script handler
      await scriptHandler.stop(nodeProcess.session)
      
      measurements.push({
        nodeProcessId: nodeProcess.targetId,
        before: phase === 'before' ? JSON.stringify(snapshot) : '',
        after: phase === 'after' ? JSON.stringify(snapshot) : '',
        result: snapshot,
      })
    } catch (error) {
      console.error(`Failed to measure node process ${nodeProcess.targetId}:`, error)
    }
  }
  
  return measurements
}
