interface UniqueLocation {
  readonly count: number
  readonly index: number
  readonly name: string
}

export interface UniqueLocationMap {
  readonly [key: string]: UniqueLocation
}
