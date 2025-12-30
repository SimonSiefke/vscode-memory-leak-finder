export interface ObjectWithProperty {
  readonly edgeCount: number
  readonly id: number
  readonly name: string | null
  readonly preview?: Readonly<Record<string, any>>
  readonly propertyValue: string | boolean | number | null
  readonly selfSize: number
  readonly type: string | null
}
