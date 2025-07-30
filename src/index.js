/**
 * Entry point for Tomo Client Telemetry SDK.
 * Exports the TomoClientTelemetry class for web application network instrumentation.
 * @module index
 */

import { setupTracer, getTracer } from "./otel/tracers.js";
import { patchFetch } from "./patch-fetch.js";
import { setConfig } from "./store/config-store.js";

/**
 * TomoClientTelemetry provides network tracing utilities for web applications.
 */
class TomoClientTelemetry {
  /**
   * @param {object} config - { apiKey, serviceName, serviceVersion, collectorUrl, debug }
   */
  constructor(config) {
    if (!config.apiKey) throw new Error('apiKey required')
    if (!config.serviceName) throw new Error('serviceName required')
    if (!config.serviceVersion) throw new Error('serviceVersion required')
    if (!config.collectorUrl) throw new Error('collectorUrl required')

    if (config.debug === undefined) {
      config.debug = false;
    }

    setConfig(config);
    setupTracer();
    this.tracer = getTracer();
    
    // Initialize network tracing
    this._initializeNetworkTracing();
  }

  /**
   * Returns the initialized tracer instance.
   * @returns {import('@opentelemetry/api').Tracer|null} The tracer instance or null if not initialized
   */
  getTracer() {
    return this.tracer;
  }

  /**
   * Initializes network tracing
   * @private
   */
  _initializeNetworkTracing() {
    // Setup fetch patching for HTTP request tracing
    patchFetch();
  }
}

export default TomoClientTelemetry;