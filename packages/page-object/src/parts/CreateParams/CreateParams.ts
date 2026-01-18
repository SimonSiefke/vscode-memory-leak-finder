export type CreateParams = {
  readonly electronApp: any
  readonly expect: any
  readonly ideVersion: { major: number; minor: number; patch: number } | string
  readonly page: any
  readonly platform: string
  readonly VError: any
}

export const asCreateParams = (params: any): CreateParams => params as CreateParams
