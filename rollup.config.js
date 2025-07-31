import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'default'
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
      exports: 'default'
    },
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'TomoClientTelemetry',
      sourcemap: true,
      exports: 'default',
      globals: {
        '@opentelemetry/api': 'opentelemetryApi',
        '@opentelemetry/exporter-trace-otlp-http': 'opentelemetryExporterTraceOtlpHttp',
        '@opentelemetry/resources': 'opentelemetryResources',
        '@opentelemetry/sdk-trace-base': 'opentelemetrySdkTraceBase',
        '@opentelemetry/semantic-conventions': 'opentelemetrySemanticConventions'
      }
    }
  ],
  plugins: [
    nodeResolve({
      browser: true
    }),
    commonjs(),
    terser({
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    })
  ],
  external: [
    '@opentelemetry/api',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/resources',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/semantic-conventions'
  ]
}; 