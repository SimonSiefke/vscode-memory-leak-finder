import type { MeasureRequest } from '../DeriveMeasureRequest/DeriveMeasureRequest.ts'

export const renderStartedComment = (marker: string, request: MeasureRequest): string => {
  return `${marker}
## Measure run started

The bot accepted the request and dispatched a dedicated workflow run.

- Measure: ${request.measure}
- Base commit: ${request.baseCommit}
- Candidate ref: ${request.candidateRef}

The comment will be updated when the workflow completes.`
}
