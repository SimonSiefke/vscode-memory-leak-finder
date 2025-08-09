import { nodeResolve } from '@rollup/plugin-node-resolve'
import { babel } from '@rollup/plugin-babel'

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
    babel({
      extensions: ['.js', '.ts'],
      presets: ['@babel/preset-typescript'],
      babelHelpers: 'bundled',
    }),
    nodeResolve(),
  ],
}
