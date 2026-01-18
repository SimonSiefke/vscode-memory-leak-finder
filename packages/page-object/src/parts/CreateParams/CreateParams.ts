export type CreateParams = {
  readonly electronApp?: any | undefined
  readonly expect?: any | undefined
  readonly ideVersion?: { major?: number; minor?: number; patch?: number } | string | undefined
  readonly page?: any | undefined
  readonly platform?: string | undefined
  readonly VError?: any | undefined
}

export const asCreateParams = (params: any): CreateParams => params as CreateParams
