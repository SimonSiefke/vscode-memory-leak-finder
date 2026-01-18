export interface ObjectWithProperty {
  edgeCount: number
  id: number
  name: string | null
  preview?: Readonly<Record<string, unknown>>
  propertyValue: string | boolean | number | null
  selfSize: number
  type: string | null
}
