interface IdeVersion {
  readonly major: number
  readonly minor: number
  readonly patch: number
}

export type CreateParams = {
  readonly browserRpc?: any
  readonly electronApp: any
  readonly expect: any
  readonly ideVersion: IdeVersion
  readonly page: any
  readonly platform: string
  readonly VError: any
}
