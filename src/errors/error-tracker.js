/**
 * Error tracking for Tomo Client Telemetry SDK.
 * Tracks unhandled errors, exceptions, and promise rejections.
 * @module errors/error-tracker
 */
import { getTracer } from '../otel/tracers.js'
import { runWithSpanSync } from '../otel/tracing-utils.js'

let isInitialized = false;

/**
 * Tracks an error event
 * @param {Error} error - The error object
 * @param {string} context - Error context (e.g., 'unhandled', 'promise', 'custom')
 * @param {object} attributes - Additional attributes
 */
function trackError(error, context = 'custom', attributes = {}) {
  const tracer = getTracer();
  if (!tracer) return;

  const errorMessage = error?.message || String(error);
  const errorName = error?.name || 'Error';
  const errorStack = error?.stack || '';

  runWithSpanSync('error.occurred', {
    attributes: {
      'error.message': errorMessage,
      'error.name': errorName,
      'error.stack': errorStack,
      'error.context': context,
      'error.type': 'javascript_error',
      'page.url': window.location.href,
      'page.title': document.title,
      'user.agent': navigator.userAgent,
      ...attributes
    }
  }, (span) => {
    // Span is automatically ended by runWithSpanSync
  });
}

/**
 * Tracks a resource loading error
 * @param {string} resourceType - Type of resource (script, css, image, etc.)
 * @param {string} resourceUrl - URL of the failed resource
 * @param {string} errorMessage - Error message
 * @param {object} attributes - Additional attributes
 */
function trackResourceError(resourceType, resourceUrl, errorMessage, attributes = {}) {
  const tracer = getTracer();
  if (!tracer) return;

  runWithSpanSync('error.resource', {
    attributes: {
      'error.type': 'resource_error',
      'error.resource_type': resourceType,
      'error.resource_url': resourceUrl,
      'error.message': errorMessage,
      'page.url': window.location.href,
      'page.title': document.title,
      ...attributes
    }
  }, (span) => {
    // Span is automatically ended by runWithSpanSync
  });
}

/**
 * Tracks a network error
 * @param {string} url - The URL that failed
 * @param {string} method - HTTP method
 * @param {number} status - HTTP status code
 * @param {string} errorMessage - Error message
 * @param {object} attributes - Additional attributes
 */
function trackNetworkError(url, method, status, errorMessage, attributes = {}) {
  const tracer = getTracer();
  if (!tracer) return;

  runWithSpanSync('error.network', {
    attributes: {
      'error.type': 'network_error',
      'error.url': url,
      'error.method': method,
      'error.status': status,
      'error.message': errorMessage,
      'page.url': window.location.href,
      'page.title': document.title,
      ...attributes
    }
  }, (span) => {
    // Span is automatically ended by runWithSpanSync
  });
}

/**
 * Sets up error tracking for the application
 */
export function setupErrorTracking() {
  if (isInitialized) return;
  isInitialized = true;

  // Track unhandled errors
  window.addEventListener('error', (event) => {
    trackError(event.error || event, 'unhandled', {
      'error.filename': event.filename,
      'error.lineno': event.lineno,
      'error.colno': event.colno
    });
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    trackError(error, 'promise', {
      'error.promise_reason': String(error)
    });
  });

  // Track resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target;
      const resourceType = target.tagName?.toLowerCase() || 'unknown';
      const resourceUrl = target.src || target.href || 'unknown';
      
      trackResourceError(resourceType, resourceUrl, event.message || 'Resource failed to load');
    }
  }, true); // Use capture phase

  // Track console errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorMessage = args.map(arg => String(arg)).join(' ');
    trackError(new Error(errorMessage), 'console', {
      'error.console_args': JSON.stringify(args)
    });
    originalConsoleError.apply(console, args);
  };

  // Track console warnings
  const originalConsoleWarn = console.warn;
  console.warn = function(...args) {
    const warningMessage = args.map(arg => String(arg)).join(' ');
    const tracer = getTracer();
    if (tracer) {
      runWithSpanSync('warning.occurred', {
        attributes: {
          'warning.message': warningMessage,
          'warning.type': 'console_warning',
          'page.url': window.location.href,
          'page.title': document.title,
          'warning.console_args': JSON.stringify(args)
        }
      }, (span) => {
        // Span is automatically ended by runWithSpanSync
      });
    }
    originalConsoleWarn.apply(console, args);
  };

  // Expose tracking functions globally for manual use
  if (typeof window !== 'undefined') {
    window.__tomoErrors = {
      trackError,
      trackResourceError,
      trackNetworkError
    };
  }
}

export { trackError, trackResourceError, trackNetworkError };