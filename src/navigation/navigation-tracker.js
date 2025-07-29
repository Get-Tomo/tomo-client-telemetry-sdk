/**
 * Navigation tracking for Tomo Client Telemetry SDK.
 * Tracks page views, route changes, and navigation events in SPAs.
 * @module navigation/navigation-tracker
 */
import { getTracer } from '../otel/tracers.js'
import { runWithSpanSync } from '../otel/tracing-utils.js'

let isInitialized = false;

/**
 * Tracks a page view event
 * @param {string} pageName - Page name or route
 * @param {object} attributes - Additional attributes
 */
function trackPageView(pageName, attributes = {}) {
  const tracer = getTracer();
  if (!tracer) return;

  runWithSpanSync('page.view', {
    attributes: {
      'page.name': pageName,
      'page.url': window.location.href,
      'page.title': document.title,
      'page.referrer': document.referrer,
      'page.pathname': window.location.pathname,
      'page.search': window.location.search,
      'page.hash': window.location.hash,
      'navigation.type': 'page_view',
      ...attributes
    }
  }, (span) => {
    // Span is automatically ended by runWithSpanSync
  });
}

/**
 * Tracks a route change event
 * @param {string} fromRoute - Previous route
 * @param {string} toRoute - New route
 * @param {object} attributes - Additional attributes
 */
function trackRouteChange(fromRoute, toRoute, attributes = {}) {
  const tracer = getTracer();
  if (!tracer) return;

  runWithSpanSync('navigation.route_change', {
    attributes: {
      'navigation.from_route': fromRoute,
      'navigation.to_route': toRoute,
      'navigation.type': 'route_change',
      'page.url': window.location.href,
      'page.title': document.title,
      ...attributes
    }
  }, (span) => {
    // Span is automatically ended by runWithSpanSync
  });
}

/**
 * Tracks a browser navigation event (back/forward)
 * @param {string} direction - 'back' or 'forward'
 * @param {object} attributes - Additional attributes
 */
function trackBrowserNavigation(direction, attributes = {}) {
  const tracer = getTracer();
  if (!tracer) return;

  runWithSpanSync('navigation.browser', {
    attributes: {
      'navigation.direction': direction,
      'navigation.type': 'browser',
      'page.url': window.location.href,
      'page.title': document.title,
      ...attributes
    }
  }, (span) => {
    // Span is automatically ended by runWithSpanSync
  });
}

/**
 * Sets up navigation tracking for the application
 */
export function setupNavigationTracking() {
  if (isInitialized) return;
  isInitialized = true;

  // Track initial page view
  trackPageView(window.location.pathname, {
    'navigation.type': 'initial_load'
  });

  // Track popstate events (browser back/forward)
  window.addEventListener('popstate', (event) => {
    const direction = event.state?.direction || 'unknown';
    trackBrowserNavigation(direction);
  });

  // Track beforeunload events
  window.addEventListener('beforeunload', () => {
    const tracer = getTracer();
    if (!tracer) return;

    runWithSpanSync('navigation.page_unload', {
      attributes: {
        'navigation.type': 'page_unload',
        'page.url': window.location.href,
        'page.title': document.title
      }
    }, (span) => {
      // Span is automatically ended by runWithSpanSync
    });
  });

  // Track visibility change events
  document.addEventListener('visibilitychange', () => {
    const tracer = getTracer();
    if (!tracer) return;

    const isVisible = !document.hidden;
    runWithSpanSync('navigation.visibility_change', {
      attributes: {
        'navigation.type': 'visibility_change',
        'navigation.visible': isVisible,
        'page.url': window.location.href,
        'page.title': document.title
      }
    }, (span) => {
      // Span is automatically ended by runWithSpanSync
    });
  });

  // Expose tracking functions globally for manual use
  if (typeof window !== 'undefined') {
    window.__tomoNavigation = {
      trackPageView,
      trackRouteChange,
      trackBrowserNavigation
    };
  }
}

export { trackPageView, trackRouteChange, trackBrowserNavigation };