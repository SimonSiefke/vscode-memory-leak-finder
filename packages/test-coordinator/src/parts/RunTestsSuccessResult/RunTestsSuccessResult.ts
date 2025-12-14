export type RunTestsSuccessResult = {
  type: 'success'
  passed: number
  failed: number
  skipped: number
  skippedFailed: number
  leaked: number
  total: number
  duration: number
  filterValue: string
}
