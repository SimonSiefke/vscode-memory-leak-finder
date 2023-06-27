export default {
  input: 'src/main.js',
  output: [
    {
      file: 'dist/injectedCode.js',
      format: 'es',
      sourcemap: 'inline',
    },
  ],
  external: [],
  plugins: [],
}
