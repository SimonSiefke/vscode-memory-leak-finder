export interface UniqueLocation {
  readonly count: number
  readonly index: number
}

export interface UniqueLocationMap {
  readonly [key: string]: UniqueLocation
}
