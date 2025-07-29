# Tomo Client Telemetry SDK

Open Telemetry compatible SDK to ingest telemetry data from web applications like Next.js, React, Vue, etc.

## Features

- **Automatic HTTP Request Tracing**: All `fetch` requests are automatically traced with request/response data
- **Navigation Tracking**: Tracks page views, route changes, and browser navigation events
- **Error Tracking**: Captures unhandled errors, promise rejections, and resource loading failures
- **Performance Monitoring**: Tracks web vitals, page load performance, and user interactions
- **OpenTelemetry Compatible**: Follows OpenTelemetry specification for seamless integration
- **Zero Configuration**: Drop-in solution that works out of the box
- **Framework Agnostic**: Works with any JavaScript framework (React, Vue, Angular, etc.)

## Installation

```bash
npm install @get-tomo/tomo-client-telemetry-sdk
```

## Quick Start

```javascript
import TomoClientTelemetry from '@get-tomo/tomo-client-telemetry-sdk';

// Initialize the SDK
const telemetry = new TomoClientTelemetry({
  apiKey: 'your-api-key',
  serviceName: 'my-web-app',
  serviceVersion: '1.0.0',
  collectorUrl: 'https://collector.tomo.ai',
  debug: true // Optional: enables console logging
});

// That's it! The SDK automatically starts tracking:
// - HTTP requests via fetch
// - Page views and navigation
// - Errors and exceptions
// - Performance metrics
```

## Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | Your Tomo API key |
| `serviceName` | string | Yes | Name of your service |
| `serviceVersion` | string | Yes | Version of your service |
| `collectorUrl` | string | Yes | Tomo collector endpoint URL |
| `debug` | boolean | No | Enable debug logging (default: false) |

## Automatic Tracking

### HTTP Requests
All `fetch` requests are automatically traced with:
- Request method, URL, headers, and body
- Response status, headers, and body
- Request/response timing
- Error information

### Navigation Events
- Initial page load
- Route changes (for SPAs)
- Browser back/forward navigation
- Page visibility changes
- Page unload events

### Error Tracking
- Unhandled JavaScript errors
- Unhandled promise rejections
- Resource loading failures (images, scripts, CSS)
- Console errors and warnings
- Network request failures

### Performance Metrics
- Page load timing
- DOM content loaded
- Resource loading performance
- Web vitals (LCP, FID, CLS, FCP, TTFB)
- Long tasks
- Layout shifts
- Memory usage (Chrome only)

## Manual Tracking

### Custom Events
```javascript
telemetry.trackEvent('user_action', {
  action: 'button_click',
  button_id: 'submit-form',
  user_id: '12345'
});
```

### User Interactions
```javascript
telemetry.trackInteraction('submit-button', 'click', {
  form_id: 'contact-form',
  user_type: 'premium'
});
```

### Page Views
```javascript
telemetry.trackPageView('/dashboard', {
  user_role: 'admin',
  section: 'analytics'
});
```

## Global Functions

The SDK exposes global functions for manual tracking:

```javascript
// Navigation tracking
window.__tomoNavigation.trackPageView('/new-page');
window.__tomoNavigation.trackRouteChange('/old-page', '/new-page');

// Error tracking
window.__tomoErrors.trackError(new Error('Custom error'), 'custom');
window.__tomoErrors.trackNetworkError('https://api.example.com', 'GET', 500, 'Server error');

// Performance tracking
window.__tomoPerformance.trackPerformanceMetric('custom_metric', 150, 'ms');
window.__tomoPerformance.trackWebVitals({
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  fcp: 1200,
  ttfb: 800
});
```

## Framework Integration

### React
```javascript
// In your main App.js or index.js
import TomoClientTelemetry from '@get-tomo/tomo-client-telemetry-sdk';

const telemetry = new TomoClientTelemetry({
  apiKey: 'your-api-key',
  serviceName: 'react-app',
  serviceVersion: '1.0.0',
  collectorUrl: 'https://collector.tomo.ai'
});

// Track route changes in React Router
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();
  
  useEffect(() => {
    window.__tomoNavigation.trackPageView(location.pathname);
  }, [location]);

  return <YourApp />;
}
```

### Vue
```javascript
// In your main.js
import TomoClientTelemetry from '@get-tomo/tomo-client-telemetry-sdk';

const telemetry = new TomoClientTelemetry({
  apiKey: 'your-api-key',
  serviceName: 'vue-app',
  serviceVersion: '1.0.0',
  collectorUrl: 'https://collector.tomo.ai'
});

// Track route changes in Vue Router
router.afterEach((to, from) => {
  window.__tomoNavigation.trackRouteChange(from.path, to.path);
});
```

### Next.js
```javascript
// In your _app.js
import TomoClientTelemetry from '@get-tomo/tomo-client-telemetry-sdk';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

let telemetry;

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if (!telemetry) {
      telemetry = new TomoClientTelemetry({
        apiKey: 'your-api-key',
        serviceName: 'nextjs-app',
        serviceVersion: '1.0.0',
        collectorUrl: 'https://collector.tomo.ai'
      });
    }
  }, []);

  useEffect(() => {
    window.__tomoNavigation.trackPageView(router.asPath);
  }, [router.asPath]);

  return <Component {...pageProps} />;
}
```

## Data Collected

The SDK collects comprehensive telemetry data including:

### Request Data
- HTTP method, URL, headers
- Request body (truncated to 2048 chars)
- Query parameters
- Response status, headers, body
- Timing information

### User Context
- User agent
- Screen resolution
- Viewport size
- Page URL and title
- Referrer information

### Performance Data
- Page load metrics
- Resource loading times
- Web vitals
- Memory usage
- Long tasks

### Error Information
- Error message, name, and stack trace
- Error context and type
- File name, line number, column number
- Resource loading failures

## Privacy & Security

- Request/response bodies are truncated to prevent sensitive data exposure
- The SDK skips tracing requests to the collector endpoint itself
- All data is sent over HTTPS to the specified collector
- No personally identifiable information is collected by default

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details.
