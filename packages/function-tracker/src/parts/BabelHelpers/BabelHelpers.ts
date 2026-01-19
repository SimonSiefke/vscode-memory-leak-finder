import generate from '@babel/generator'
import parser from '@babel/parser'
import traverse from '@babel/traverse'

// @ts-ignore
export const parser2 = (parser.default || parser) as typeof import('@babel/parser')
export const traverse2 = (traverse.default || traverse) as typeof import('@babel/traverse').default
export const generate2 = (generate.default || generate) as typeof import('@babel/generator').default
