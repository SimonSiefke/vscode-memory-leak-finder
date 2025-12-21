export interface MockResponse {
  readonly statusCode: number
  readonly headers: Record<string, string | string[]>
  readonly body: any | Buffer
}
