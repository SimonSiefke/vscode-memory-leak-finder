import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolPerformance } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import type { BrowserPerformanceMetricsSample } from '../BrowserPerformanceMetrics/BrowserPerformanceMetrics.ts'

export const getBrowserPerformanceMetrics = async (session: Session): Promise<BrowserPerformanceMetricsSample> => {
  const result = await DevtoolsProtocolPerformance.getMetrics(session, {})
  return result as BrowserPerformanceMetricsSample
}
