import { nodeResolve } from '@rollup/plugin-node-resolve'

export default {
  input: '../injected-code/src/main.js',
  output: [
    {
      file: '../injected-code/dist/injectedCode.js',
      format: 'es',
      sourcemap: true,
    },
  ],
  external: [],
  plugins: [nodeResolve()],
}
