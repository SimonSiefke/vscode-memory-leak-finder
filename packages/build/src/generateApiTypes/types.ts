export interface ParameterInfo {
  name: string
  isOptional: boolean
}

export interface MethodInfo {
  name: string
  parameters: ParameterInfo[]
  returnType: string
  isAsync: boolean
}

export interface PropertyInfo {
  name: string
  type: string
}
