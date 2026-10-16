import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // TODO: fix rollup-plugin-dts compatibility with TS 7
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'es2022',
});
