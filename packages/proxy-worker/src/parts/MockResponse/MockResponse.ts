export interface MockResponse {
  readonly body: any | Buffer
  readonly headers: Record<string, string | string[]>
  readonly statusCode: number
}
