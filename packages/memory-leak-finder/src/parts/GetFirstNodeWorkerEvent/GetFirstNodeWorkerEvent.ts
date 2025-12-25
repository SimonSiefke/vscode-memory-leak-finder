import * as FirstNodeWorkerEventType from '../FirstNodeWorkerEventType/FirstNodeWorkerEventType.ts'
import * as GetFirstEvent from '../GetFirstEvent/GetFirstEvent.ts'

export const getFirstNodeWorkerEvent = (worker) => {
  return GetFirstEvent.getFirstEvent(worker, {
    error: FirstNodeWorkerEventType.Error,
    exit: FirstNodeWorkerEventType.Exit,
    message: FirstNodeWorkerEventType.Message,
  })
}
