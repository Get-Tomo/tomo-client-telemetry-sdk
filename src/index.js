/**
 * Entry point for Tomo Client Telemetry SDK.
 * Exports the TomoClientTelemetry class for web application instrumentation.
 * @module index
 */

import { setupTracer, getTracer } from "./otel/tracers.js";
import { wrapFetch } from "./patch-fetch.js";
import { setupNavigationTracking } from "./navigation/navigation-tracker.js";
import { setupErrorTracking } from "./errors/error-tracker.js";
import { setupPerformanceTracking } from "./performance/performance-tracker.js";
import { setConfig } from "./store/config-store.js";

/**
 * TomoClientTelemetry provides tracing utilities for web applications.
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
    
    // Initialize tracking modules
    this._initializeTracking();
  }

  /**
   * Returns the initialized tracer instance.
   * @returns {import('@opentelemetry/api').Tracer|null} The tracer instance or null if not initialized
   */
  getTracer() {
    return this.tracer;
  }

  /**
   * Initializes all tracking modules
   * @private
   */
  _initializeTracking() {
    const config = getConfig();
    
    // Setup fetch patching for HTTP request tracing
    wrapFetch();
    
    // Setup navigation tracking for SPA routing
    setupNavigationTracking();
    
    // Setup error tracking for unhandled errors
    setupErrorTracking();
    
    // Setup performance tracking for web vitals
    setupPerformanceTracking();
  }

  /**
   * Manually track a custom event
   * @param {string} name - Event name
   * @param {object} attributes - Event attributes
   */
  trackEvent(name, attributes = {}) {
    const tracer = getTracer();
    if (!tracer) return;

    const span = tracer.startSpan(name, {
      attributes: {
        'event.type': 'custom',
        ...attributes
      }
    });
    span.end();
  }

  /**
   * Manually track a user interaction
   * @param {string} elementId - Element ID or selector
   * @param {string} action - Action type (click, input, etc.)
   * @param {object} attributes - Additional attributes
   */
  trackInteraction(elementId, action, attributes = {}) {
    const tracer = getTracer();
    if (!tracer) return;

    const span = tracer.startSpan('user.interaction', {
      attributes: {
        'interaction.element': elementId,
        'interaction.action': action,
        'interaction.type': 'user',
        ...attributes
      }
    });
    span.end();
  }

  /**
   * Track page view with custom attributes
   * @param {string} pageName - Page name or route
   * @param {object} attributes - Page view attributes
   */
  trackPageView(pageName, attributes = {}) {
    const tracer = getTracer();
    if (!tracer) return;

    const span = tracer.startSpan('page.view', {
      attributes: {
        'page.name': pageName,
        'page.url': window.location.href,
        'page.title': document.title,
        ...attributes
      }
    });
    span.end();
  }
}

export default TomoClientTelemetry;