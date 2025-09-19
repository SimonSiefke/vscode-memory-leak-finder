const pageObjects = Object.create(null)

export const getPageObject = (pageObjectId) => {
  const value = pageObjects[pageObjectId]
  if (!value) {
    console.log({ pageObjects })
    throw new Error(`no page object found with id ${[pageObjectId]}`)
  }
  return value
}

export const set = (pageObjectId, pageObject) => {
  pageObjects[pageObjectId] = pageObject
}
