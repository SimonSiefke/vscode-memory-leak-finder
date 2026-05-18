export const createRequestId = (issueNumber: number, commentId: number): string => {
  return `measure-run-${issueNumber}-${commentId}`
}
