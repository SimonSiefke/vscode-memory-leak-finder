export const isDevtoolsCannotFindContextError = (error) => {
  return (
    error.name === 'DevtoolsProtocolError' &&
    (error.message === 'Cannot find context with specified id' || error.message === 'uniqueContextId not found')
  )
}
