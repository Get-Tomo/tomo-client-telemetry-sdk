/**
 * Tracing utility functions for Tomo Client Telemetry SDK.
 * Includes helpers for running code within spans and setting HTTP span status.
 * @module otel/tracing-utils
 */
import { context, trace, SpanStatusCode } from '@opentelemetry/api'
import { getTracer } from './tracers.js'

/**
 * Runs an async function within a span context, handling status and errors.
 * @param {string} name - Span name
 * @param {object} options - Span options (kind, attributes, parentContext)
 * @param {function} fn - Async function to run within the span
 * @returns {Promise<*>}
 */
export async function runWithSpan(name, options, fn) {
  const tracer = getTracer()
  if (!tracer) {
    return await fn(null)
  }
  
  const parentContext = options && options.parentContext ? options.parentContext : context.active()
  const span = tracer.startSpan(name, options, parentContext)
  try {
    return await context.with(trace.setSpan(parentContext, span), async () => {
      return await fn(span)
    })
  } catch (err) {
    span.setStatus({ code: SpanStatusCode.ERROR })
    throw err
  } finally {
    span.end()
  }
}

/**
 * Sets multiple attributes on the given OpenTelemetry span.
 *
 * @param {import('@opentelemetry/api').Span} span - The span to set attributes on.
 * @param {Object.<string, any>} attributes - An object containing key-value pairs to set as attributes on the span.
 */
export function setSpanAttributes(span, attributes) {
  if (!span) return
  
  for (const [key, value] of Object.entries(attributes)) {
    span.setAttribute(key, value)
  }
}

/**
 * Creates a span for synchronous operations.
 * @param {string} name - Span name
 * @param {object} options - Span options
 * @param {function} fn - Function to run within the span
 * @returns {*} The result of the function
 */
export function runWithSpanSync(name, options, fn) {
  const tracer = getTracer()
  if (!tracer) {
    return fn(null)
  }
  
  const parentContext = options && options.parentContext ? options.parentContext : context.active()
  const span = tracer.startSpan(name, options, parentContext)
  try {
    return context.with(trace.setSpan(parentContext, span), () => {
      return fn(span)
    })
  } catch (err) {
    span.setStatus({ code: SpanStatusCode.ERROR })
    throw err
  } finally {
    span.end()
  }
}