/**
 * Performance tracking for Tomo Client Telemetry SDK.
 * Tracks web vitals, performance metrics, and user experience data.
 * @module performance/performance-tracker
 */
import { getTracer } from '../otel/tracers.js'
import { runWithSpanSync } from '../otel/tracing-utils.js'

let isInitialized = false;

/**
 * Tracks a performance metric
 * @param {string} metricName - Name of the metric
 * @param {number} value - Metric value
 * @param {string} unit - Unit of measurement
 * @param {object} attributes - Additional attributes
 */
function trackPerformanceMetric(metricName, value, unit = 'ms', attributes = {}) {
  const tracer = getTracer();
  if (!tracer) return;

  runWithSpanSync('performance.metric', {
    attributes: {
      'performance.metric_name': metricName,
      'performance.value': value,
      'performance.unit': unit,
      'page.url': window.location.href,
      'page.title': document.title,
      ...attributes
    }
  }, (span) => {
    // Span is automatically ended by runWithSpanSync
  });
}

/**
 * Tracks web vitals metrics
 * @param {object} vitals - Web vitals object
 * @param {object} attributes - Additional attributes
 */
function trackWebVitals(vitals, attributes = {}) {
  const tracer = getTracer();
  if (!tracer) return;

  runWithSpanSync('performance.web_vitals', {
    attributes: {
      'performance.lcp': vitals.lcp,
      'performance.fid': vitals.fid,
      'performance.cls': vitals.cls,
      'performance.fcp': vitals.fcp,
      'performance.ttfb': vitals.ttfb,
      'page.url': window.location.href,
      'page.title': document.title,
      ...attributes
    }
  }, (span) => {
    // Span is automatically ended by runWithSpanSync
  });
}

/**
 * Tracks page load performance
 * @param {object} attributes - Additional attributes
 */
function trackPageLoadPerformance(attributes = {}) {
  const tracer = getTracer();
  if (!tracer) return;

  const navigation = performance.getEntriesByType('navigation')[0];
  if (!navigation) return;

  runWithSpanSync('performance.page_load', {
    attributes: {
      'performance.dom_content_loaded': navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      'performance.load_complete': navigation.loadEventEnd - navigation.loadEventStart,
      'performance.dom_interactive': navigation.domInteractive,
      'performance.dom_complete': navigation.domComplete,
      'performance.redirect_count': navigation.redirectCount,
      'performance.transfer_size': navigation.transferSize,
      'performance.encoded_body_size': navigation.encodedBodySize,
      'performance.decoded_body_size': navigation.decodedBodySize,
      'page.url': window.location.href,
      'page.title': document.title,
      ...attributes
    }
  }, (span) => {
    // Span is automatically ended by runWithSpanSync
  });
}

/**
 * Tracks resource loading performance
 * @param {object} attributes - Additional attributes
 */
function trackResourcePerformance(attributes = {}) {
  const tracer = getTracer();
  if (!tracer) return;

  const resources = performance.getEntriesByType('resource');
  
  resources.forEach(resource => {
    runWithSpanSync('performance.resource', {
      attributes: {
        'performance.resource_name': resource.name,
        'performance.resource_type': resource.initiatorType,
        'performance.duration': resource.duration,
        'performance.transfer_size': resource.transferSize,
        'performance.encoded_body_size': resource.encodedBodySize,
        'performance.decoded_body_size': resource.decodedBodySize,
        'performance.start_time': resource.startTime,
        'page.url': window.location.href,
        'page.title': document.title,
        ...attributes
      }
    }, (span) => {
      // Span is automatically ended by runWithSpanSync
    });
  });
}

/**
 * Tracks user interaction performance
 * @param {string} interactionType - Type of interaction
 * @param {number} duration - Duration of interaction
 * @param {object} attributes - Additional attributes
 */
function trackInteractionPerformance(interactionType, duration, attributes = {}) {
  const tracer = getTracer();
  if (!tracer) return;

  runWithSpanSync('performance.interaction', {
    attributes: {
      'performance.interaction_type': interactionType,
      'performance.duration': duration,
      'page.url': window.location.href,
      'page.title': document.title,
      ...attributes
    }
  }, (span) => {
    // Span is automatically ended by runWithSpanSync
  });
}

/**
 * Sets up performance tracking for the application
 */
export function setupPerformanceTracking() {
  if (isInitialized) return;
  isInitialized = true;

  // Track initial page load performance
  if (document.readyState === 'complete') {
    trackPageLoadPerformance();
  } else {
    window.addEventListener('load', () => {
      trackPageLoadPerformance();
    });
  }

  // Track DOM content loaded
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    trackPerformanceMetric('dom_content_loaded', performance.now(), 'ms');
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      trackPerformanceMetric('dom_content_loaded', performance.now(), 'ms');
    });
  }

  // Track resource performance after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      trackResourcePerformance();
    }, 1000); // Wait a bit for all resources to load
  });

  // Track long tasks
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          trackPerformanceMetric('long_task', entry.duration, 'ms', {
            'performance.long_task_start': entry.startTime,
            'performance.long_task_name': entry.name
          });
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task observer not supported
    }
  }

  // Track layout shifts
  if ('PerformanceObserver' in window) {
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        if (clsValue > 0) {
          trackPerformanceMetric('cumulative_layout_shift', clsValue, 'score');
        }
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Layout shift observer not supported
    }
  }

  // Track first input delay
  if ('PerformanceObserver' in window) {
    try {
      const firstInputObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          trackPerformanceMetric('first_input_delay', entry.processingStart - entry.startTime, 'ms', {
            'performance.input_type': entry.name
          });
        });
      });
      firstInputObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // First input observer not supported
    }
  }

  // Track memory usage if available
  if ('memory' in performance) {
    setInterval(() => {
      const memory = performance.memory;
      trackPerformanceMetric('memory_used', memory.usedJSHeapSize, 'bytes', {
        'performance.memory_total': memory.totalJSHeapSize,
        'performance.memory_limit': memory.jsHeapSizeLimit
      });
    }, 30000); // Every 30 seconds
  }

  // Expose tracking functions globally for manual use
  if (typeof window !== 'undefined') {
    window.__tomoPerformance = {
      trackPerformanceMetric,
      trackWebVitals,
      trackPageLoadPerformance,
      trackResourcePerformance,
      trackInteractionPerformance
    };
  }
}

export { 
  trackPerformanceMetric, 
  trackWebVitals, 
  trackPageLoadPerformance, 
  trackResourcePerformance, 
  trackInteractionPerformance 
};