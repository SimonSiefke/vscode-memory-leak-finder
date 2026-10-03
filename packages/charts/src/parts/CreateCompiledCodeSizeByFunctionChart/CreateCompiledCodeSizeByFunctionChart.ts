import { getCompiledCodeSizeByFunctionData } from '../GetCompiledCodeSizeData/GetCompiledCodeSizeData.ts'

export const name = 'compiled-code-size-by-function'

export const getData = (basePath: string): Promise<any[]> => getCompiledCodeSizeByFunctionData(basePath)

export const createChart = () => {
  return {
    fontSize: 12,
    marginLeft: 620,
    marginRight: 190,
    title: 'Largest compiled-code functions',
    type: 'compiled-code-size-chart',
    width: 1700,
  }
}

export const multiple = true
