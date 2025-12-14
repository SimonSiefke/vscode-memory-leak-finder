export interface BisectResult {
  type: 'success' | 'failed-test' | 'not-found'
  commit?: string
}
