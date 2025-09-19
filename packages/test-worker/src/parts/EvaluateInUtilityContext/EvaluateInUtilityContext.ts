import * as PageObjectState from '../PageObjectState/PageObjectState.ts'

// TODO use page object
export const evaluateInUtilityContext = async (options: any, sessionId: any = ''): Promise<any> => {
  const connectionId = 1
  const pageObject = PageObjectState.getPageObjectContext(connectionId)
  const result = await pageObject.evaluateInUtilityContext(options)
  return result
}

export const evaluateInDefaultContext = async (options: any, sessionId: any = ''): Promise<any> => {
  throw new Error(`not implemented`)
}
