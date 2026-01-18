import type { MethodInfo, PropertyInfo } from './types.ts'

export const generateInterfaceFromMethods = (methods: MethodInfo[], properties: PropertyInfo[], interfaceName: string): string => {
  const methodSignatures = methods
    .map((method) => {
      const params = method.parameters
        .map((param) => {
          const optional = param.isOptional ? '?' : ''
          return `${param.name}${optional}: any`
        })
        .join(', ')

      return `  ${method.name}(${params}): ${method.returnType}`
    })
    .join('\n')

  const propertySignatures = properties.map((prop) => `  readonly ${prop.name}: ${prop.type}`).join('\n')

  const allSignatures = methodSignatures + (propertySignatures ? '\n' + propertySignatures : '')

  return `export interface ${interfaceName} {\n${allSignatures}\n}`
}
