import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

export default {
  input: '../injected-code/src/main.ts',
  output: [
    {
      file: '../injected-code/dist/injectedCode.js',
      format: 'es',
      sourcemap: true,
    },
  ],
  external: [],
  plugins: [
    typescript({
      tsconfig: '../injected-code/tsconfig.build.json',
      sourceMap: true,
    }),
    nodeResolve(),
  ],
}
