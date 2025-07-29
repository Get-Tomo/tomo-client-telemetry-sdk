import { trace } from '@opentelemetry/api'
import { BasicTracerProvider, BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { getConfig } from '../store/config-store.js'

let tracer

/**
 * Tracer setup and retrieval utilities for Tomo Client Telemetry SDK.
 * Provides functions to initialize and access the OpenTelemetry tracer.
 * @module otel/tracers
 */

/**
 * Sets up the OpenTelemetry tracer provider and exporters.
 */
function setupTracer() {
  const config = getConfig();

  const resource = resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
    [SemanticResourceAttributes.TELEMETRY_SDK_LANGUAGE]: 'javascript',
    [SemanticResourceAttributes.TELEMETRY_SDK_NAME]: 'tomo-client-telemetry-sdk',
    [SemanticResourceAttributes.TELEMETRY_SDK_VERSION]: '0.1.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'browser',
    'user.agent': navigator.userAgent,
    'screen.resolution': `${screen.width}x${screen.height}`,
    'viewport.size': `${window.innerWidth}x${window.innerHeight}`
  })

  const traceExporter = new OTLPTraceExporter({
    url: config.collectorUrl,
    headers: {
      'x-api-key': config.apiKey
    }
  })

  const exporters = [
    new BatchSpanProcessor(traceExporter)
  ];

  if (config.debug) {
    const consoleExporter = new ConsoleSpanExporter();
    exporters.push(new BatchSpanProcessor(consoleExporter));
  }
  
  const provider = new BasicTracerProvider(
    { 
      resource,
      spanProcessors: exporters
    }
  )

  trace.setGlobalTracerProvider(provider)
  tracer = trace.getTracer(config.serviceName)
}

/**
 * Returns the initialized tracer instance.
 * @returns {import('@opentelemetry/api').Tracer|undefined} The tracer instance or undefined if not initialized.
 */
function getTracer() {
  return tracer
}

export { setupTracer, getTracer }