export interface BisectResult {
  commit?: string
  type: 'success' | 'failed-test' | 'not-found'
}
