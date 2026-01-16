import * as Assert from '@lvce-editor/assert'

export const connectDevtools = async (
  devtoolsWebSocketUrl: string,
  electronWebSocketUrl: string,
  connectionId: number,
  measureId: string,
  attachedToPageTimeout: number,
  pid: number,
): Promise<void> => {
  // TODO 1. connect to devtools
  // 2. pause page / ensure page is paused on start
  // 3. setup logic to intercept js ntwork requests
  // 4. replace js ntwork requests with custom requests
}
