import * as PageObjectState from '../PageObjectState/PageObjectState.ts'

export const toHaveTitle = async (page, expectedTitle) => {
  const connectionId = 1
  const pageObject = PageObjectState.getPageObjectContext(connectionId)
  // @ts-ignore
  const actualTitle = await pageObject.utilityContext.callFunctionOn({
    arguments: [
      {
        value: expectedTitle,
      },
    ],
    awaitPromise: true,
    functionDeclaration: '(expectedTitle) => test.checkTitle(expectedTitle)',
    returnByValue: true,
  })
}
