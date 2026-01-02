export const formatStackTrace = (stackTrace: string | string[]): string => {
  if (Array.isArray(stackTrace)) {
    return stackTrace.join('\n')
  }
  return stackTrace
}

