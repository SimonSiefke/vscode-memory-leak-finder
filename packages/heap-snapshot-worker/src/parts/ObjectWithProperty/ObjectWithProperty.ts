export interface ObjectWithProperty {
  id: number
  name: string | null
  propertyValue: string | boolean | number | null
  type: string | null
  selfSize: number
  edgeCount: number
  preview?: Record<string, any>
}
