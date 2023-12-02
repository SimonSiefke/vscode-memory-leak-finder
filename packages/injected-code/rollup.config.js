import { nodeResolve } from '@rollup/plugin-node-resolve'

export default {
  input: 'src/main.js',
  output: [
    {
      file: 'dist/injectedCode.js',
      format: 'es',
      sourcemap: true,
    },
  ],
  external: [],
  plugins: [nodeResolve()],
}
