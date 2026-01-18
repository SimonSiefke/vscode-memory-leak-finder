interface IdeVersion {
  readonly major: number
  readonly minor: number
  readonly patch: number
}

export type CreateParams = {
  readonly electronApp: any
  readonly expect: any
  readonly ideVersion: IdeVersion
  readonly page: any
  readonly platform: string
  readonly VError: any
}

export const asCreateParams = (params: any): CreateParams => params as CreateParams
